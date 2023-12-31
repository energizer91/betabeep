import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { Beep } from "./models/beep";

export type BeepConfig = {
  method: "GET" | "POST";
  name: string;
  waitForResponse?: boolean;
  variables?: Record<string, string | undefined> | null | undefined;
  timeout?: number;
};

// Utility to promisify exec for async/await usage
const execAsync = (command: string, options: Parameters<typeof exec>[1]) =>
  new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });

export const setupBeep = async (url: string, config: BeepConfig) => {
  const beepsPath = path.join(__dirname, "beeps");
  const newBeep = new Beep(config);
  const beepPath = path.join(beepsPath, newBeep.id);

  if (fs.existsSync(beepPath)) {
    throw new Error("Beep is already installed");
  }

  // Git clone
  await execAsync(`git clone ${url} ${beepPath}`, {});

  // Run yarn install
  await execAsync(`yarn install`, { cwd: beepPath });

  // save lambda in db
  await newBeep.save();

  return newBeep;
};

export const updateBeep = async (beepId: string) => {
  const beep = await getBeep(beepId);

  if (!beep) {
    throw new Error("Beep not found");
  }

  const beepsPath = path.join(__dirname, "beeps");
  const beepPath = path.join(beepsPath, beepId);

  if (!fs.existsSync(beepPath)) {
    throw new Error("Beep is not installed");
  }

  // Git clone
  await execAsync(`git pull`, { cwd: beepPath });

  // Run yarn install
  await execAsync(`yarn install`, { cwd: beepPath });
};

export const deleteBeep = async (beepId: string) => {
  const beep = await Beep.findByIdAndDelete(beepId);

  if (!beep) {
    throw new Error("Beep not found");
  }

  const beepsPath = path.join(__dirname, "beeps");
  const beepPath = path.join(beepsPath, beepId);

  // Git clone
  await execAsync(`rm -rf ${beepPath}`, {});
};

export const getBeep = async (id: string) => {
  const beep = Beep.findById(id);

  if (!beep) {
    return null;
  }

  return beep;
};

export const getBeeps = async () => {
  return Beep.find();
};
