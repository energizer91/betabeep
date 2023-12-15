import { Record } from "./models/record";
import { v4 as uuidv4 } from "uuid";

export const saveResult = async (
  beepId: string,
  data: string,
  type = "result",
  session = uuidv4()
) => {
  const record = new Record({
    type,
    beepId,
    data,
    session,
  });

  await record.save();

  return record;
};

export const getRecords = async (beepId: string, skip = 0, limit = 100) => {
  return Record.find({ beepId: beepId }).skip(skip).limit(limit);
};
