UPDATE membership.user
	SET cart = jsonb_set(cart, '{items}', '{}'::jsonb)
	WHERE id = $1;