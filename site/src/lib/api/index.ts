/**
 * Drop-in replacement for `@workspace/api-client-react`.
 *
 * Exports the exact same hook and helper names, query keys and result shapes as
 * the Orval-generated HTTP client, but every call is served from the browser's
 * `localStorage` via `./store`. Pages and components import from this module
 * unchanged.
 */
import {
  useMutation,
  useQuery,
  type MutationFunction,
  type QueryFunction,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import * as store from "./store";
import type {
  CreateEntryBody,
  DailyStatItem,
  Entry,
  ErrorResponse,
  HealthStatus,
  ListEntriesParams,
  Profile,
  StatsSummary,
  TodayRecommendation,
  UpsertProfileBody,
  WeightTrendItem,
} from "./types";

export type * from "./types";
export { LocalApiError as ApiError } from "./store";

type ErrorType<T = unknown> = Error;

// ---------------------------------------------------------------------------
// health
// ---------------------------------------------------------------------------

export const getHealthCheck = async (): Promise<HealthStatus> =>
  store.healthCheck();

export const getHealthCheckQueryKey = () => [`/api/healthz`] as const;

export const getHealthCheckQueryOptions = <TData = HealthStatus>(options?: {
  query?: UseQueryOptions<HealthStatus, ErrorType<unknown>, TData>;
}) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getHealthCheckQueryKey();

  const queryFn: QueryFunction<HealthStatus> = () => getHealthCheck();

  return {
    queryKey,
    queryFn,
    staleTime: Infinity,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<HealthStatus, ErrorType<unknown>, TData> & {
    queryKey: QueryKey;
  };
};

export type HealthCheckQueryResult = HealthStatus;
export type HealthCheckQueryError = ErrorType<unknown>;

export function useHealthCheck<TData = HealthStatus>(options?: {
  query?: UseQueryOptions<HealthStatus, ErrorType<unknown>, TData>;
}): UseQueryResult<TData, ErrorType<unknown>> & { queryKey: QueryKey } {
  const queryOptions = getHealthCheckQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<
    TData,
    ErrorType<unknown>
  > & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

// ---------------------------------------------------------------------------
// profile
// ---------------------------------------------------------------------------

export const getProfile = async (): Promise<Profile> => store.getProfile();

export const getGetProfileQueryKey = () => [`/api/profile`] as const;

export const getGetProfileQueryOptions = <
  TData = Profile,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Profile, TError, TData>;
}) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetProfileQueryKey();

  const queryFn: QueryFunction<Profile> = () => getProfile();

  return {
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<Profile, TError, TData> & { queryKey: QueryKey };
};

export type GetProfileQueryResult = Profile;
export type GetProfileQueryError = ErrorType<ErrorResponse>;

export function useGetProfile<
  TData = Profile,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Profile, TError, TData>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetProfileQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const upsertProfile = async (
  upsertProfileBody: UpsertProfileBody,
): Promise<Profile> => store.upsertProfile(upsertProfileBody);

export const getUpsertProfileMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Profile,
    TError,
    { data: UpsertProfileBody },
    TContext
  >;
}): UseMutationOptions<
  Profile,
  TError,
  { data: UpsertProfileBody },
  TContext
> => {
  const mutationKey = ["upsertProfile"];
  const { mutation: mutationOptions } = options ?? {};

  const mutationFn: MutationFunction<Profile, { data: UpsertProfileBody }> = (
    props,
  ) => upsertProfile(props.data);

  return { mutationKey, mutationFn, ...mutationOptions };
};

export type UpsertProfileMutationResult = Profile;
export type UpsertProfileMutationBody = UpsertProfileBody;
export type UpsertProfileMutationError = ErrorType<unknown>;

export const useUpsertProfile = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Profile,
      TError,
      { data: UpsertProfileBody },
      TContext
    >;
  },
): UseMutationResult<Profile, TError, { data: UpsertProfileBody }, TContext> =>
  useMutation(getUpsertProfileMutationOptions(options)) as UseMutationResult<
    Profile,
    TError,
    { data: UpsertProfileBody },
    TContext
  >;

// ---------------------------------------------------------------------------
// entries
// ---------------------------------------------------------------------------

export const listEntries = async (
  params?: ListEntriesParams,
): Promise<Entry[]> => store.listEntries(params);

export const getListEntriesQueryKey = (params?: ListEntriesParams) =>
  [`/api/entries`, params ?? {}] as const;

export const getListEntriesQueryOptions = <
  TData = Entry[],
  TError = ErrorType<unknown>,
>(params?: ListEntriesParams, options?: { query?: UseQueryOptions<Entry[], TError, TData> }) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListEntriesQueryKey(params);

  const queryFn: QueryFunction<Entry[]> = () => listEntries(params);

  return {
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<Entry[], TError, TData> & { queryKey: QueryKey };
};

export type ListEntriesQueryResult = Entry[];
export type ListEntriesQueryError = ErrorType<unknown>;

export function useListEntries<
  TData = Entry[],
  TError = ErrorType<unknown>,
>(
  params?: ListEntriesParams,
  options?: { query?: UseQueryOptions<Entry[], TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListEntriesQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const createEntry = async (
  createEntryBody: CreateEntryBody,
): Promise<Entry> => store.upsertEntryByDate(createEntryBody.date, createEntryBody);

export const getCreateEntryMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Entry,
    TError,
    { data: CreateEntryBody },
    TContext
  >;
}): UseMutationOptions<Entry, TError, { data: CreateEntryBody }, TContext> => {
  const mutationKey = ["createEntry"];
  const { mutation: mutationOptions } = options ?? {};

  const mutationFn: MutationFunction<Entry, { data: CreateEntryBody }> = (
    props,
  ) => createEntry(props.data);

  return { mutationKey, mutationFn, ...mutationOptions };
};

export type CreateEntryMutationResult = Entry;
export type CreateEntryMutationBody = CreateEntryBody;
export type CreateEntryMutationError = ErrorType<unknown>;

export const useCreateEntry = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Entry,
      TError,
      { data: CreateEntryBody },
      TContext
    >;
  },
): UseMutationResult<Entry, TError, { data: CreateEntryBody }, TContext> =>
  useMutation(getCreateEntryMutationOptions(options)) as UseMutationResult<
    Entry,
    TError,
    { data: CreateEntryBody },
    TContext
  >;

export const getTodayEntry = async (): Promise<Entry> => store.getTodayEntry();

export const getGetTodayEntryQueryKey = () => [`/api/entries/today`] as const;

export const getGetTodayEntryQueryOptions = <
  TData = Entry,
  TError = ErrorType<ErrorResponse>,
>(options?: { query?: UseQueryOptions<Entry, TError, TData> }) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetTodayEntryQueryKey();

  const queryFn: QueryFunction<Entry> = () => getTodayEntry();

  return {
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<Entry, TError, TData> & { queryKey: QueryKey };
};

export type GetTodayEntryQueryResult = Entry;
export type GetTodayEntryQueryError = ErrorType<ErrorResponse>;

export function useGetTodayEntry<
  TData = Entry,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<Entry, TError, TData>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetTodayEntryQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getEntryByDate = async (date: string): Promise<Entry> =>
  store.getEntryByDate(date);

export const getGetEntryByDateQueryKey = (date: string) =>
  [`/api/entries/${date}`] as const;

export const getGetEntryByDateQueryOptions = <
  TData = Entry,
  TError = ErrorType<unknown>,
>(date: string, options?: { query?: UseQueryOptions<Entry, TError, TData> }) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetEntryByDateQueryKey(date);

  const queryFn: QueryFunction<Entry> = () => getEntryByDate(date);

  return {
    queryKey,
queryFn,
    enabled: !!date,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<Entry, TError, TData> & { queryKey: QueryKey };
};

export type GetEntryByDateQueryResult = Entry;
export type GetEntryByDateQueryError = ErrorType<unknown>;

export function useGetEntryByDate<
  TData = Entry,
  TError = ErrorType<unknown>,
>(
  date: string,
  options?: { query?: UseQueryOptions<Entry, TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetEntryByDateQueryOptions(date, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const upsertEntryByDate = async (
  date: string,
  createEntryBody: CreateEntryBody,
): Promise<Entry> => store.upsertEntryByDate(date, createEntryBody);

export const getUpsertEntryByDateMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Entry,
    TError,
    { date: string; data: CreateEntryBody },
    TContext
  >;
}): UseMutationOptions<
  Entry,
  TError,
  { date: string; data: CreateEntryBody },
  TContext
> => {
  const mutationKey = ["upsertEntryByDate"];
  const { mutation: mutationOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Entry,
    { date: string; data: CreateEntryBody }
  > = (props) => upsertEntryByDate(props.date, props.data);

  return { mutationKey, mutationFn, ...mutationOptions };
};

export type UpsertEntryByDateMutationResult = Entry;
export type UpsertEntryByDateMutationBody = CreateEntryBody;
export type UpsertEntryByDateMutationError = ErrorType<unknown>;

export const useUpsertEntryByDate = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Entry,
    TError,
    { date: string; data: CreateEntryBody },
    TContext
  >;
}): UseMutationResult<
  Entry,
  TError,
  { date: string; data: CreateEntryBody },
  TContext
> =>
  useMutation(getUpsertEntryByDateMutationOptions(options)) as UseMutationResult<
    Entry,
    TError,
    { date: string; data: CreateEntryBody },
    TContext
  >;

export const deleteEntry = async (date: string): Promise<void> =>
  store.deleteEntry(date);

export const getDeleteEntryMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    void,
    TError,
    { date: string },
    TContext
  >;
}): UseMutationOptions<void, TError, { date: string }, TContext> => {
  const mutationKey = ["deleteEntry"];
  const { mutation: mutationOptions } = options ?? {};

  const mutationFn: MutationFunction<void, { date: string }> = (props) =>
    deleteEntry(props.date);

  return { mutationKey, mutationFn, ...mutationOptions };
};

export type DeleteEntryMutationResult = void;
export type DeleteEntryMutationError = ErrorType<unknown>;

export const useDeleteEntry = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<void, TError, { date: string }, TContext>;
  },
): UseMutationResult<void, TError, { date: string }, TContext> =>
  useMutation(getDeleteEntryMutationOptions(options)) as UseMutationResult<
    void,
    TError,
    { date: string },
    TContext
  >;

// ---------------------------------------------------------------------------
// stats
// ---------------------------------------------------------------------------

export const getStatsSummary = async (): Promise<StatsSummary> =>
  store.getStatsSummary();

export const getGetStatsSummaryQueryKey = () => [`/api/stats/summary`] as const;

export const getGetStatsSummaryQueryOptions = <
  TData = StatsSummary,
  TError = ErrorType<unknown>,
>(options?: { query?: UseQueryOptions<StatsSummary, TError, TData> }) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetStatsSummaryQueryKey();

  const queryFn: QueryFunction<StatsSummary> = () => getStatsSummary();

  return {
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<StatsSummary, TError, TData> & { queryKey: QueryKey };
};

export type GetStatsSummaryQueryResult = StatsSummary;
export type GetStatsSummaryQueryError = ErrorType<unknown>;

export function useGetStatsSummary<
  TData = StatsSummary,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<StatsSummary, TError, TData>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetStatsSummaryQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getWeeklyStats = async (): Promise<DailyStatItem[]> =>
  store.getWeeklyStats();

export const getGetWeeklyStatsQueryKey = () => [`/api/stats/weekly`] as const;

export const getGetWeeklyStatsQueryOptions = <
  TData = DailyStatItem[],
  TError = ErrorType<unknown>,
>(options?: { query?: UseQueryOptions<DailyStatItem[], TError, TData> }) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetWeeklyStatsQueryKey();

  const queryFn: QueryFunction<DailyStatItem[]> = () => getWeeklyStats();

  return {
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<DailyStatItem[], TError, TData> & { queryKey: QueryKey };
};

export type GetWeeklyStatsQueryResult = DailyStatItem[];
export type GetWeeklyStatsQueryError = ErrorType<unknown>;

export function useGetWeeklyStats<
  TData = DailyStatItem[],
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<DailyStatItem[], TError, TData>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetWeeklyStatsQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getMonthlyStats = async (): Promise<DailyStatItem[]> =>
  store.getMonthlyStats();

export const getGetMonthlyStatsQueryKey = () => [`/api/stats/monthly`] as const;

export const getGetMonthlyStatsQueryOptions = <
  TData = DailyStatItem[],
  TError = ErrorType<unknown>,
>(options?: { query?: UseQueryOptions<DailyStatItem[], TError, TData> }) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetMonthlyStatsQueryKey();

  const queryFn: QueryFunction<DailyStatItem[]> = () => getMonthlyStats();

  return {
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<DailyStatItem[], TError, TData> & { queryKey: QueryKey };
};

export type GetMonthlyStatsQueryResult = DailyStatItem[];
export type GetMonthlyStatsQueryError = ErrorType<unknown>;

export function useGetMonthlyStats<
  TData = DailyStatItem[],
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<DailyStatItem[], TError, TData>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetMonthlyStatsQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getWeightTrend = async (): Promise<WeightTrendItem[]> =>
  store.getWeightTrend();

export const getGetWeightTrendQueryKey = () =>
  [`/api/stats/weight-trend`] as const;

export const getGetWeightTrendQueryOptions = <
  TData = WeightTrendItem[],
  TError = ErrorType<unknown>,
>(options?: { query?: UseQueryOptions<WeightTrendItem[], TError, TData> }) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetWeightTrendQueryKey();

  const queryFn: QueryFunction<WeightTrendItem[]> = () => getWeightTrend();

  return {
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<WeightTrendItem[], TError, TData> & {
    queryKey: QueryKey;
  };
};

export type GetWeightTrendQueryResult = WeightTrendItem[];
export type GetWeightTrendQueryError = ErrorType<unknown>;

export function useGetWeightTrend<
  TData = WeightTrendItem[],
  TError = ErrorType<unknown>,
>(options?: { query?: UseQueryOptions<WeightTrendItem[], TError, TData> },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetWeightTrendQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getTodayRecommendation =
  async (): Promise<TodayRecommendation> => store.getTodayRecommendation();

export const getGetTodayRecommendationQueryKey = () =>
  [`/api/stats/today-recommendation`] as const;

export const getGetTodayRecommendationQueryOptions = <
  TData = TodayRecommendation,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<TodayRecommendation, TError, TData>;
}) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetTodayRecommendationQueryKey();

  const queryFn: QueryFunction<TodayRecommendation> = () =>
    getTodayRecommendation();

  return {
    queryKey,
    queryFn,
    retry: false,
    ...queryOptions,
  } as UseQueryOptions<TodayRecommendation, TError, TData> & {
    queryKey: QueryKey;
  };
};

export type GetTodayRecommendationQueryResult = TodayRecommendation;
export type GetTodayRecommendationQueryError = ErrorType<ErrorResponse>;

export function useGetTodayRecommendation<
  TData = TodayRecommendation,
  TError = ErrorType<ErrorResponse>,
>(options?: {
  query?: UseQueryOptions<TodayRecommendation, TError, TData>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetTodayRecommendationQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}