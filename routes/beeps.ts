import express from "express";
import {
  deleteBeep,
  getBeep,
  getBeeps,
  setupBeep,
  updateBeep,
} from "../beepManager";
import { getRecords } from "../recordManager";
import { beepInvocationRoute } from "./invoke";

const router = express.Router();

router.use(
  "/:beepId/invoke",
  // special case for beeps execution. they should get exactly the same body as request executor
  express.raw({ inflate: true, limit: "100kb", type: "*/*" }),
  beepInvocationRoute
);

// for the rest we can use default json body parser
router.use(express.json());

router.post("/", async (req, res, next) => {
  const { url, config } = req.body;

  if (!url || !config) {
    return res
      .status(400)
      .json({ message: "Git URL and beep configuration are required" });
  }

  try {
    const newBeep = await setupBeep(url, config);
    res.status(200).send({
      message: "Beep successfully added, cloned, and installed",
      path: `/beeps/${newBeep.id}/invoke`,
    });
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

    res.status(200).send({
      message: "Beep successfully updated",
      path: `/beeps/${beep.id}`,
    });
  } catch (error) {
    return next(error);
  }
});

// delete beep (rm -rf)
router.delete("/:beepId", async (req, res, next) => {
  const { beepId } = req.params;

  try {
    await deleteBeep(beepId);

    res.status(200).send({
      message: "Beep successfully deleted",
    });
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

    return res.json(
      beeps.map((b) => ({ ...b.toObject(), variables: "hidden" }))
    );
  } catch (e) {
    return next(e);
  }
});

// get beep logs
router.get("/:beepId/records", async (req, res, next) => {
  const { beepId } = req.params;
  const { skip, limit } = req.query;

  try {
    const beep = await getBeep(beepId);

    if (!beep) {
      return res.status(400).json({ message: "Beep not found" });
    }

    const records = await getRecords(beepId, Number(skip), Number(limit));

    return res.json(records);
  } catch (e) {
    return next(e);
  }
});

export default router;
