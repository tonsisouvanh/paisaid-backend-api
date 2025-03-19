import path from "path";
import { Request, Response, NextFunction } from "express";

const fileExtLimiter = (allowedExtArray: Array<string>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.files) return next();
    const files = req.files;

    const fileExtensions: string[] = [];
    Object.keys(files).forEach((key) => {
      const file = files[key];
      if (Array.isArray(file)) {
        file.forEach((f) => fileExtensions.push(path.extname(f.name)));
      } else {
        fileExtensions.push(path.extname(file.name));
      }
    });

    // Are the file extensions allowed?
    const allowed = fileExtensions.every((ext) =>
      allowedExtArray.includes(ext)
    );

    if (!allowed) {
      const message =
        `Upload failed. Only ${allowedExtArray.toString()} files allowed.`.replace(
          /,/g,
          ", "
        );

      res.status(422).json({ status: "error", message });
      return;
    }

    next();
  };
};

export default fileExtLimiter;

// import  path from "path";
// import { Request, Response, NextFunction } from "express";

// const fileExtLimiter = (allowedExtArray: Array<string>) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.files) return next();
//     const files = req.files;

//     const fileExtensions: any[] = [];
//     Object.keys(files).forEach((key) => {
//       const file = files[key];
//       if (Array.isArray(file)) {
//         file.forEach((f) => fileExtensions.push(path.extname(f.name)));
//       } else {
//         fileExtensions.push(path.extname(file.name));
//       }
//     });

//     // Are the file extension allowed?
//     const allowed = fileExtensions.every((ext) =>
//       allowedExtArray.includes(ext)
//     );

//     if (!allowed) {
//       const message =
//         `Upload failed. Only ${allowedExtArray.toString()} files allowed.`.replaceAll(
//           ",",
//           ", "
//         );

//       return res.status(422).json({ status: "error", message });
//     }

//     next();
//   };
// };

// export default fileExtLimiter;
