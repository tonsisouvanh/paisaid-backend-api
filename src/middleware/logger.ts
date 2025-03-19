// import { format } from "date-fns";
// import { v4 as uuidv4 } from "uuid";
// import  path from "path";
// import { promises as fsPromises, existsSync } from "fs";
// import { fileURLToPath } from "url";
// import { Request, Response, NextFunction } from "express";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const logEvents = async (message: string, logFileName: string) => {
//   const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
//   const logItem = `${dateTime}\t${uuidv4()}\t${message}\n`;

//   try {
//     const logDir = path.join(__dirname, "..", "logs");
//     if (!existsSync(logDir)) {
//       await fsPromises.mkdir(logDir);
//     }
//     await fsPromises.appendFile(path.join(logDir, logFileName), logItem);
//   } catch (err) {
//     console.log(err);
//   }
// };

// const logger = (req: Request, res: Response, next: NextFunction) => {
//   logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log");
//   console.log(`${req.method} ${req.path}`);
//   next();
// };

// export { logEvents, logger };
