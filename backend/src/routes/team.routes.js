import { createTeam, getTeams, updateTeam, deleteTeam, addMemberToTeam } from "../controllers/team.controller.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { validateTeamCreation, validateAddMember } from "../middlewares/validation.js";

import { Router } from "express";

const router = Router();

router.post("/teams", isAuthenticated, validateTeamCreation, createTeam);
router.get("/teams/get-team", isAuthenticated, getTeams);
router.put("/teams/:id", isAuthenticated, updateTeam);
router.delete("/teams/:id", isAuthenticated, deleteTeam);
router.post("/teams/:id/members", isAuthenticated, validateAddMember, addMemberToTeam);

export default router;
