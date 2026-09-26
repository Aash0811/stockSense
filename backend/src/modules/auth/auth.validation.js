const { z } = require("zod");

const loginSchema = z.object({
	body: z.object({
		email: z.string().trim().email(),
		password: z.string().min(1),
	}),
	params: z.object({}),
	query: z.object({}),
});

const signupSchema = z.object({
	body: z.object({
		name: z.string().trim().min(2).max(100),
		email: z.string().trim().email(),
		password: z.string().min(8).max(100),
	}),
	params: z.object({}),
	query: z.object({}),
});

const requestResetSchema = z.object({
	body: z.object({ email: z.string().trim().email() }),
	params: z.object({}),
	query: z.object({}),
});

const resetPasswordSchema = z.object({
	body: z.object({ email: z.string().trim().email(), otp: z.string().regex(/^\d{6}$/), password: z.string().min(8).max(100) }),
	params: z.object({}),
	query: z.object({}),
});

module.exports = {
	loginSchema,
	signupSchema,
	requestResetSchema,
	resetPasswordSchema,
};
