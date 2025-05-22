import { NextRequest } from "next/server";

export type ApiRouteParams<T> = {
  params: T;
};

export type ApiRouteHandler<T> = (
  request: NextRequest,
  context: ApiRouteParams<T>,
) => Promise<Response>;

