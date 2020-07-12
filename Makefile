release:
	production=1 yarn build && \
	coscmd upload -r -s dist /u2web/static/