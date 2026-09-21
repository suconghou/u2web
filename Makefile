release:
	production=1 npm run build && \
	coscmd upload -r -s dist /u2web/static/

dev:
	npm run dev

build:
	npm run build
