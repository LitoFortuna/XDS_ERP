import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPlannerTasks, addPlannerTask, updatePlannerTask, deletePlannerTask } from '../../services/domain/plannerService';
import { PlannerTask } from '../../../types';

const EMPTY_TASKS: PlannerTask[] = [];
const QUERY_KEY = ['plannerTasks'];

// Solo se monta (y por tanto solo descarga) cuando el admin abre el Calendario. Las mutaciones
// parchean la caché directamente en vez de invalidarla, para no volver a descargar toda la
// colección por cada tarea que se marca como hecha.
export const usePlannerTasks = () => {
    const queryClient = useQueryClient();

    const { data: tasks = EMPTY_TASKS, isLoading, error } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: fetchPlannerTasks,
        staleTime: 1000 * 60 * 5,
    });

    const addMutation = useMutation({
        mutationFn: async (task: Omit<PlannerTask, 'id'>) => {
            const id = await addPlannerTask(task);
            return { ...task, id } as PlannerTask;
        },
        onSuccess: (created) => {
            queryClient.setQueryData<PlannerTask[]>(QUERY_KEY, (old = []) => [...old, created]);
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (task: PlannerTask) => {
            await updatePlannerTask(task);
            return task;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData<PlannerTask[]>(QUERY_KEY, (old = []) =>
                old.map(t => (t.id === updated.id ? updated : t))
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (taskId: string) => {
            await deletePlannerTask(taskId);
            return taskId;
        },
        onSuccess: (taskId) => {
            queryClient.setQueryData<PlannerTask[]>(QUERY_KEY, (old = []) => old.filter(t => t.id !== taskId));
        },
    });

    return {
        tasks,
        isLoading,
        error,
        addTask: addMutation.mutateAsync,
        updateTask: updateMutation.mutateAsync,
        deleteTask: deleteMutation.mutateAsync,
    };
};
