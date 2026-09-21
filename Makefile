release:
	VITE_BASE='https://assets.suconghou.cn/u2web/static/dist/' npm run build && \
	coscmd upload -r -s dist /u2web/static/

dev:
	npm run dev

build:
	npm run build
