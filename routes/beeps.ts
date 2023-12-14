import path from "path";
import { fork } from "child_process";
import { type Router } from "express";
import type { IncomingHttpHeaders } from "node:http";
import { getBeep, getBeeps, setupBeep, updateBeep } from "../beepManager";

type BeepResponse = {
  statusCode: number;
  body: string;
}

type BeepPayload = {
  body: string;
  headers: IncomingHttpHeaders;
}

function executeBeep(name: string, payload: BeepPayload, variables = {}, timeout = 0): Promise<BeepResponse> {
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

export const createBeepRoutes = (router: Router) => {
  router.use("/:beepId/invoke", async (req, res, next) => {
    const { body, params, method, headers } = req;
    const { beepId } = params;

    try {
      // get from database later
      const beepConfig = await getBeep(beepId);

      if (!beepConfig) {
        return next();
      }

      const { method: beepMethod, name, variables, waitForResponse, timeout } = beepConfig;

      if (beepMethod && beepMethod !== method) {
        return next();
      }

      if (!waitForResponse) {
        res.status(200).send({ ok: true });
      }

      const beepPath = path.join(__dirname, "../beeps", name, "handler.js");
      const result = await executeBeep(beepPath, { body: (body || "").toString(), headers }, variables || {}, timeout);

      console.log('Beep', beepId, 'responded with', result);

      if (waitForResponse) {
        res.status(result.statusCode).send(JSON.parse(result.body));
      }
    } catch (e) {
      return next(e);
    }
  });

  router.post("/", async (req, res, next) => {
    const { url, config } = req.body;

    if (!url || !config) {
      return res.status(400).json({ message: "Git URL and beep configuration are required" });
    }

    try {
      const newBeep = await setupBeep(url, config);
      res.status(200).send({ message: "Beep successfully added, cloned, and installed", path: `/beeps/${newBeep.id}/invoke` });
    } catch (error) {
      return next(error);
    }
  });

  // update endpoint (git pull + yarn install)
  router.post("/:beepId", async (req, res, next) => {
    const { beepId } = req.params;

    try {
      const beep = await getBeep(beepId);

      if (!beep) {
        return res.status(400).json({ message: "Beep not found" });
      }

      await updateBeep(beep.name);
      res.status(200).send({ message: "Beep successfully updated", path: `/beeps/${beep.id}` });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:beepId", async (req, res, next) => {
    const { beepId } = req.params;

    try {
      const beep = await getBeep(beepId);

      if (!beep) {
        return res.status(400).json({ message: "Beep not found" });
      }

      const beepInfo = { ...beep.toObject(), variables: "hidden" };

      return res.json(beepInfo);
    } catch (e) {
      return next(e);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const beeps = await getBeeps();

      if (!beeps) {
        return res.status(400).json({ message: "Beeps not found" });
      }

      return res.json(beeps.map(b => ({ ...b.toObject(), variables: "hidden" })));
    } catch (e) {
      return next(e);
    }
  });

  return router;
};