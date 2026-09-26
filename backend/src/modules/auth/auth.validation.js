const { z } = require("zod");

const loginSchema = z.object({
	body: z.object({
		email: z.string().trim().email(),
		password: z.string().min(1),
	}),
	params: z.object({}),
	query: z.object({}),
});

module.exports = {
	loginSchema,
};
