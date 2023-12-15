import path from "path";
import { getBeep } from "../beepManager";
import { saveResult } from "../recordManager";
import type { IncomingHttpHeaders } from "node:http";
import { fork } from "child_process";
import { RequestHandler } from "express-serve-static-core";
import { v4 as uuidv4 } from "uuid";

type BeepResponse = {
  statusCode: number;
  body: string;
};

type BeepPayload = {
  body: string;
  headers: IncomingHttpHeaders;
};

function executeBeep(
  name: string,
  payload: BeepPayload,
  variables = {},
  timeout = 30000
): Promise<BeepResponse> {
  return new Promise((resolve, reject) => {
    const beepProcess = fork("bootstrap.js", { env: variables });

    let timer: NodeJS.Timeout;

    if (timeout > 0) {
      timer = setTimeout(() => {
        if (beepProcess) {
          beepProcess.kill();
          reject(new Error("process timed out"));
        }
      }, timeout);
    }

    beepProcess.on("message", (message: BeepResponse) => {
      clearTimeout(timer);
      resolve(message);
    });

    beepProcess.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    beepProcess.on("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Beep process exited with code ${code}`));
      }
    });

    // Send initial message with lambda name and body
    beepProcess.send({ name, payload });
  });
}

export const beepInvocationRoute: RequestHandler = async (req, res, next) => {
  const { body, params, method, headers } = req;
  const { beepId } = params;
  const session = uuidv4();

  try {
    // get from database later
    const beepConfig = await getBeep(beepId);
    const bodyString = (body || "").toString();

    if (!beepConfig) {
      return next();
    }

    await saveResult(beepId, bodyString, "request");

    const {
      method: beepMethod,
      variables,
      waitForResponse,
      timeout,
    } = beepConfig;

    if (beepMethod && beepMethod !== method) {
      return next();
    }

    if (!waitForResponse) {
      res.status(200).send({ ok: true });
    }

    const beepPath = path.join(__dirname, "../beeps", beepId, "handler.js");
    const result = await executeBeep(
      beepPath,
      { body: bodyString.toString(), headers },
      variables || {},
      timeout
    );

    await saveResult(beepId, JSON.stringify(result), "response", session);

    console.log("Beep", beepId, "responded with", result);

    if (waitForResponse) {
      res.status(result.statusCode).send(JSON.parse(result.body));
    }
  } catch (e) {
    await saveResult(beepId, (e as Error).message, "error", session);
    return next(e);
  }
};
