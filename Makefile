PROJ = flashcards

ifndef PROJ
$(error variable $$PROJ needs to be defined)
endif


POD_MOUNTS = \
	-w /app \
	-v $(PWD):/app:z \
	--tmpfs /app/_site \
	-v pnpm-global:/usr/local:z \
	-v pnpm-store:/usr/local/share/pnpm:z \
	-v pnpm-config:/root/.config/pnpm:z \
	-v $(PROJ)_modules:/app/node_modules:z

POD_OPTIONS_TEMPLATE = \
	--interactive --tty \
	--rm \
	--name $(PROJ)_$(CONTAINER_TAG) \
	$(POD_MOUNTS) $(EXTRA_FLAGS) \
	node:alpine

dev: EXTRA_FLAGS = --publish 5173:5173
dev: SCRIPT = dev --host
dev: run

build: SCRIPT = build
build: run

run: CONTAINER_TAG = $(firstword $(SCRIPT))
run:
	podman run $(POD_OPTIONS_TEMPLATE) pnpm run $(SCRIPT)


setup: SCRIPT = setup
setup:
	podman run $(POD_OPTIONS_TEMPLATE) sh -c 'command -v pnpm || npm install -g pnpm'
	podman run $(POD_OPTIONS_TEMPLATE) pnpm config set store-dir /usr/local/share/pnpm --global
	podman run $(POD_OPTIONS_TEMPLATE) pnpm install

sh: CONTAINER_TAG = sh
sh:
	podman run $(POD_OPTIONS_TEMPLATE) sh

decks: src/decks/
	make $(addprefix public/decks/,$(subst yml,min.json,$(notdir $(wildcard src/decks/*.yml))))
	cd public/decks/; jo -a *.min.json > ../../src/decks.json

public/decks/%.min.json: src/decks/%.yml
	yq --output-format json --indent 0 $< > $@
