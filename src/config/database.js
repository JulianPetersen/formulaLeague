import mongoose from 'mongoose';

// export const connectDB = async () => {
//   try {
//     await mongoose.connect("mongodb://localhost:27017/formulaLeague", {
//       user: "admin",
//       pass: "Frigg.37021125",
//       authSource: "admin"
//     });

//     console.log("🔥 MongoDB conectado");
//   } catch (error) {
//     console.error("❌ Error en MongoDB:", error);
//     process.exit(1);
//   }
// }; 

//dev

export const connectDB = async () => {
  try {  
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || "formulaLeague"
    });
    console.log("🔥 MongoDB conectado");
  } catch (error) {
    console.error("❌ Error en MongoDB:", error);
    process.exit(1);
  }
};
