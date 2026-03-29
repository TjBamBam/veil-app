import { createProxyMiddleware } from '@supabase/auth-helpers/nextjs';
//Proxy for authentication
export const updateSession = createProxyMiddleware();
