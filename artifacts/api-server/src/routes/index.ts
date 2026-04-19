import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import entriesRouter from "./entries";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(entriesRouter);
router.use(statsRouter);

export default router;
