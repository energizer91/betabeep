import { Record } from "./models/record";
import { v4 as uuidv4 } from "uuid";

export const saveResult = async (
  beepId: string,
  result: string,
  type = "result",
  session = uuidv4()
) => {
  const record = new Record({
    type,
    beepId,
    result,
    session,
  });

  await record.save();

  return record;
};

export const getRecords = async (beepId: string) => {
  return Record.find({ beepId: beepId });
};