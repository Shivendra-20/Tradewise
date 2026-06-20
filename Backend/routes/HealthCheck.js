import Router from "express";

const router = Router();

router.get("/",(req,res)=>{
    res.status(200).json({message:"😎😍😍 Health check route is running"});
})

export default router;