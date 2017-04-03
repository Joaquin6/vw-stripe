SELECT * FROM membership.dealer
	WHERE id IN
		(SELECT dealer_id FROM membership.user
			WHERE membership.user.id = $1);