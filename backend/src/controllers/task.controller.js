import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiErrors.js';
import ApiResponse from '../utils/ApiResponse.js';
import pool from '../db/index.js';

const createTask = asyncHandler(async (req, res) => {
  const { title, description, team_id, assigned_to, due_date, status } = req.body;
  const userId = req.user.id;

  if (!title || !team_id) {
    throw new ApiError(400, 'Title and team_id are required');
  }

  const client = await pool.connect();

  try {
    // Check if user is member or creator of the team
    const checkQuery = `
      SELECT * FROM teams
      WHERE id = $1 AND (creator_id = $2 OR id IN (
        SELECT team_id FROM team_memberships WHERE user_id = $2
      ))
    `;
    const checkResult = await client.query(checkQuery, [team_id, userId]);
    if (checkResult.rows.length === 0) {
      throw new ApiError(403, 'Not authorized to create task in this team');
    }

    const insertQuery = `
      INSERT INTO tasks (title, description, team_id, assigned_to, due_date, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [title, description || '', team_id, assigned_to || null, due_date || null, status || 'pending', userId];

    const result = await client.query(insertQuery, values);
    res.status(201).json(new ApiResponse(201, result.rows[0], 'Task created successfully'));
  } catch (error) {
    console.error('Error creating task:', error.message);
    throw new ApiError(500, 'Failed to create task');
  } finally {
    client.release();
  }
});

const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { team_id, assigned_to } = req.query;
  const client = await pool.connect();

  try {
    let baseQuery = `
      SELECT tasks.* FROM tasks
      JOIN teams ON tasks.team_id = teams.id
      WHERE (teams.creator_id = $1 OR teams.id IN (
        SELECT team_id FROM team_memberships WHERE user_id = $1
      ))
    `;
    const params = [userId];
    let paramIndex = 2;

    if (team_id) {
      baseQuery += ` AND tasks.team_id = $${paramIndex}`;
      params.push(team_id);
      paramIndex++;
    }

    if (assigned_to) {
      baseQuery += ` AND tasks.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    const result = await client.query(baseQuery, params);
    res.status(200).json(new ApiResponse(200, result.rows, 'Tasks fetched successfully'));
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    throw new ApiError(500, 'Failed to fetch tasks');
  } finally {
    client.release();
  }
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, assigned_to, due_date, status } = req.body;
  const userId = req.user.id;

  if (!title && !description && !assigned_to && !due_date && !status) {
    throw new ApiError(400, 'At least one field must be provided to update');
  }

  const client = await pool.connect();

  try {
    // Check if user is creator or assigned to the task
    const checkQuery = `
      SELECT * FROM tasks
      WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)
    `;
    const checkResult = await client.query(checkQuery, [id, userId]);
    if (checkResult.rows.length === 0) {
      throw new ApiError(403, 'Not authorized to update this task');
    }

    const updateQuery = `
      UPDATE tasks
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          assigned_to = COALESCE($3, assigned_to),
          due_date = COALESCE($4, due_date),
          status = COALESCE($5, status)
      WHERE id = $6
      RETURNING *;
    `;
    const values = [title, description, assigned_to, due_date, status, id];
    const result = await client.query(updateQuery, values);
    res.status(200).json(new ApiResponse(200, result.rows[0], 'Task updated successfully'));
  } catch (error) {
    console.error('Error updating task:', error.message);
    throw new ApiError(500, 'Failed to update task');
  } finally {
    client.release();
  }
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();

  try {
    // Check if user is creator of the task
    const checkQuery = `
      SELECT * FROM tasks
      WHERE id = $1 AND created_by = $2
    `;
    const checkResult = await client.query(checkQuery, [id, userId]);
    if (checkResult.rows.length === 0) {
      throw new ApiError(403, 'Not authorized to delete this task');
    }

    const deleteQuery = 'DELETE FROM tasks WHERE id = $1';
    await client.query(deleteQuery, [id]);
    res.status(200).json(new ApiResponse(200, null, 'Task deleted successfully'));
  } catch (error) {
    console.error('Error deleting task:', error.message);
    throw new ApiError(500, 'Failed to delete task');
  } finally {
    client.release();
  }
});

export { createTask, getTasks, updateTask, deleteTask };
