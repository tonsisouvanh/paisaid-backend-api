import allowedOrigins from "./allowOrigins";

// For mobile test
// const corsOptions = {
//   origin: (
//     origin: string | undefined,
//     callback: (err: Error | null, allow?: boolean | string) => void
//   ) => {
//     console.log("CORS Origin Check - Request Origin:", origin);
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, origin || true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT"],
//   allowedHeaders: [
//     "Access-Control-Allow-Headers",
//     "Origin",
//     "Accept",
//     "X-Requested-With",
//     "Content-Type",
//     "Access-Control-Request-Method",
//     "Access-Control-Request-Headers",
//   ],
// };

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsOptions;
