import { Request, Response, NextFunction } from "express";
const MB = 5; // 5 MB
const FILE_SIZE_LIMIT = MB * 1024 * 1024;

const fileSizeLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.files) return next();
  const files = req.files;

  const filesOverLimit: any[] = [];
  // Which files are over the limit?
  Object.keys(files).forEach((key) => {
    const file = files[key];
    if (Array.isArray(file)) {
      file.forEach((f) => {
        if (f.size > FILE_SIZE_LIMIT) {
          filesOverLimit.push(f.name);
        }
      });
    } else {
      if (file.size > FILE_SIZE_LIMIT) {
        filesOverLimit.push(file.name);
      }
    }
  });

  if (filesOverLimit.length) {
    const properVerb = filesOverLimit.length > 1 ? "are" : "is";

    const sentence =
      `Upload failed. ${filesOverLimit.toString()} ${properVerb} over the file size limit of ${MB} MB.`.replace(
        /,/g,
        ", "
      );

    const message =
      filesOverLimit.length < 3
        ? sentence.replace(",", " and")
        : sentence.replace(/,(?=[^,]*$)/, " and");

    res.status(413).json({ status: "error", message });
    return;
  }

  next();
};

export default fileSizeLimiter;
