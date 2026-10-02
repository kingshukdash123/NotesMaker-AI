import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  createTask, 
  getTasksByDate, 
  getTasksByMonth, 
  toggleTaskStatus, 
  deleteTask,
  updateTaskDetails
} from '../services/firebase/plannerService';

export function usePlanner() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [monthTasks, setMonthTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTasksByDate = useCallback(async (date) => {
    if (!currentUser || !date) return;
    setIsLoading(true);
    try {
      const data = await getTasksByDate(currentUser.uid, date);
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks by date:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const fetchTasksByMonth = useCallback(async (startDateStr, endDateStr) => {
    if (!currentUser) return;
    try {
      const data = await getTasksByMonth(currentUser.uid, startDateStr, endDateStr);
      setMonthTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks by month:', err);
    }
  }, [currentUser]);

  const addTask = useCallback(async (title, date, priority = 'medium') => {
    if (!currentUser) return;
    try {
      const taskId = await createTask(currentUser.uid, title, date, priority);
      const newTask = {
        id: taskId,
        userId: currentUser.uid,
        title,
        date,
        priority,
        completed: false,
        createdAt: new Date()
      };
      
      // New tasks go to the top (first)
      setTasks(prev => [newTask, ...prev]);
      setMonthTasks(prev => [newTask, ...prev]);
      return taskId;
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  }, [currentUser]);

  const toggleTask = useCallback(async (taskId, currentCompleted) => {
    try {
      // Complete server operation first so loader displays in-place before reordering
      await toggleTaskStatus(taskId, currentCompleted);
      
      const updateOrder = (prev) => {
        const target = prev.find(t => t.id === taskId);
        if (!target) return prev;
        const updatedTarget = { ...target, completed: !currentCompleted };
        const rest = prev.filter(t => t.id !== taskId);

        if (!currentCompleted) {
          // Setting to DONE: move to the last position
          return [...rest, updatedTarget];
        } else {
          // Setting to NOT DONE: move to the first position
          return [updatedTarget, ...rest];
        }
      };

      setTasks(updateOrder);
      setMonthTasks(updateOrder);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  }, []);

  const removeTask = useCallback(async (taskId) => {
    if (!currentUser) return;
    try {
      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setMonthTasks(prev => prev.filter(t => t.id !== taskId));
      
      await deleteTask(currentUser.uid, taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [currentUser]);

  const updateTask = useCallback(async (taskId, title, priority) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title, priority } : t));
      setMonthTasks(prev => prev.map(t => t.id === taskId ? { ...t, title, priority } : t));
      
      await updateTaskDetails(taskId, title, priority);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, []);

  return {
    tasks,
    monthTasks,
    isLoading,
    fetchTasksByDate,
    fetchTasksByMonth,
    addTask,
    toggleTask,
    removeTask,
    updateTask
  };
}
