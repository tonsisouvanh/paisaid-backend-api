import { Request, Response, NextFunction } from "express";

interface ResponseBody {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  timestamp: string;
  errorCode?: string;
  httpCode?: number;
}

export const responseFormatter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (data) {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

    const responseBody: ResponseBody = {
      success: isSuccess,
      errorCode: data.errorCode || "",
      httpCode: res.statusCode,
      message: isSuccess
        ? data.message || "Request processed successfully"
        : data.message || "An error occurred",
      timestamp: new Date().toISOString(),
      ...(isSuccess ? { ...data } : { error: data }),
    };

    return originalJson.call(this, responseBody);
  };

  next();
};

// ============================================================

// import { Request, Response, NextFunction } from "express";

// interface ResponseBody {
//   success: boolean;
//   message: string;
//   data?: any;
//   error?: any;
//   timestamp: string;
// }

// export const responseFormatter = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const originalJson = res.json;

//   res.json = function (data) {
//     let responseBody: ResponseBody;
//     if (res.statusCode >= 200 && res.statusCode < 300) {
//       responseBody = {
//         success: true,
//         message: "Request processed successfully",
//         data,
//         timestamp: new Date().toISOString(),
//       };
//     } else {
//       responseBody = {
//         success: false,
//         message: data.message || "An error occurred",
//         error: data,
//         timestamp: new Date().toISOString(),
//       };
//     }

//     return originalJson.call(this, responseBody);
//   };

//   next();
// };
