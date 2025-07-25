import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiErrors.js';
import ApiResponse from '../utils/ApiResponse.js';
import pool from '../db/index.js';

const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name || !description) {
    throw new ApiError(400, 'Name and description are required');
  }

  const client = await pool.connect();

  try {
    const insertQuery = `
      INSERT INTO teams (name, description, creator_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [name, description, userId];

    const result = await client.query(insertQuery, values);
    const newTeam = result.rows[0];

    res
      .status(201)
      .json(new ApiResponse(201, newTeam, 'Team created successfully'));
  } catch (error) {
    console.error('Error creating team:', error.message);
    throw new ApiError(500, 'Failed to create team');
  } finally {
    client.release();
  }
});

const getTeams = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();

  try {
    const query = `
      SELECT * FROM teams
      WHERE creator_id = $1
      OR id IN (
        SELECT team_id FROM team_memberships WHERE user_id = $1
      );
    `;
    const result = await client.query(query, [userId]);
    res
      .status(200)
      .json(new ApiResponse(200, result.rows, 'Teams fetched successfully'));
  } catch (error) {
    console.error('Error fetching teams:', error.message);
    throw new ApiError(500, 'Failed to fetch teams');
  } finally {
    client.release();
  }
});

const updateTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name && !description) {
    throw new ApiError(
      400,
      'At least one of name or description must be provided',
    );
  }

  const client = await pool.connect();

  try {
    // Check if user is creator of the team
    const checkQuery = 'SELECT * FROM teams WHERE id = $1 AND creator_id = $2';
    const checkResult = await client.query(checkQuery, [id, userId]);
    if (checkResult.rows.length === 0) {
      throw new ApiError(403, 'Not authorized to update this team');
    }

    const updateQuery = `
      UPDATE teams
      SET name = COALESCE($1, name),
          description = COALESCE($2, description)
      WHERE id = $3
      RETURNING *;
    `;
    const values = [name, description, id];
    const result = await client.query(updateQuery, values);
    res
      .status(200)
      .json(new ApiResponse(200, result.rows[0], 'Team updated successfully'));
  } catch (error) {
    console.error('Error updating team:', error.message);
    throw new ApiError(500, 'Failed to update team');
  } finally {
    client.release?.();
  }
});

const deleteTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();

  try {
    // Check if user is creator of the team
    const checkQuery = 'SELECT * FROM teams WHERE id = $1 AND creator_id = $2';
    const checkResult = await client.query(checkQuery, [id, userId]);
    if (checkResult.rows.length === 0) {
      throw new ApiError(403, 'Not authorized to delete this team');
    }

    const deleteQuery = 'DELETE FROM teams WHERE id = $1';
    await client.query(deleteQuery, [id]);
    res
      .status(200)
      .json(new ApiResponse(200, null, 'Team deleted successfully'));
  } catch (error) {
    console.error('Error deleting team:', error.message);
    throw new ApiError(500, 'Failed to delete team');
  } finally {
    client.release?.();
  }
});

const addMemberToTeam = asyncHandler(async (req, res) => {
  const { id } = req.params; // team id
  const { userIdToAdd } = req.body;
  const userId = req.user.id;

  if (!userIdToAdd) {
    throw new ApiError(400, 'User ID to add is required');
  }

  const client = await pool.connect();

  try {
    // Check if user is creator of the team
    const checkQuery = 'SELECT * FROM teams WHERE id = $1 AND creator_id = $2';
    const checkResult = await client.query(checkQuery, [id, userId]);
    if (checkResult.rows.length === 0) {
      throw new ApiError(403, 'Not authorized to add members to this team');
    }

    // Check if user to add exists
    const userCheck = await client.query('SELECT * FROM users WHERE id = $1', [
      userIdToAdd,
    ]);
    if (userCheck.rows.length === 0) {
      throw new ApiError(404, 'User to add not found');
    }

    // Add member to team
    const insertQuery = `
      INSERT INTO team_memberships (team_id, user_id, role, joined_at)
      VALUES ($1, $2, 'member', NOW())
      ON CONFLICT DO NOTHING;
    `;
    await client.query(insertQuery, [id, userIdToAdd]);

    res
      .status(200)
      .json(new ApiResponse(200, null, 'Member added to team successfully'));
  } catch (error) {
    console.error('Error adding member to team:', error.message);
    throw new ApiError(500, 'Failed to add member to team');
  } finally {
    client.release?.();
  }
});

export { createTeam, getTeams, updateTeam, deleteTeam, addMemberToTeam };
