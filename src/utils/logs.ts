import { prismaConnection } from "../db.ts";
import { LogType } from "../models/Logs.ts";

export async function save_logs(type: number, userId: number) {
  await prismaConnection.logs.create({
    data: {
      type,
      userId: userId,
    },
  });
}

interface Getlogs{
    numbers_elements:number,
    type?:Array<number>,
    offset?:number
};
export async function get_logs({numbers_elements, type,offset}: Getlogs) {
  const logs = await prismaConnection.logs.findMany({
    take: numbers_elements,
    skip:offset,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      type: type ? { in: type } : undefined,
    },
    include: {
      user: true,
    },
  });
  return logs;
}
