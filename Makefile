PATH := node_modules/.bin:$(PATH)		# Adds node_modules executables to PATH
SHELL := /bin/bash 						# macOS requires this to export PATH

# Default Target
# ----------------------------------------------------------------------------
default: build

# Transpiles all source files.
# ----------------------------------------------------------------------------
build: install
	tsc --build

# Installs dependencies.
# ----------------------------------------------------------------------------
install: node_modules

# Watches source files for transpilation.
# ----------------------------------------------------------------------------
watch: install
	tsc --watch

# Cleans the project of all generated files.
# ----------------------------------------------------------------------------
clean:
	rm -rf node_modules
	rm -rf build

# Runs all verifications on a clean build.
# ----------------------------------------------------------------------------
verify: clean build lint test

# Runs all tests.
# ----------------------------------------------------------------------------
test: build
	npm test $(test_target)

# Runs all tests, and reports coverage.
# ----------------------------------------------------------------------------
cover: build
	npm test $(test_target) -- --coverage

# Runs a specific test file.
%.test.ts: FORCE
	@make test test_target="$@"

# Lints source files.
# ----------------------------------------------------------------------------
lint:
	npm run lint

# Lists all available targets.
# ----------------------------------------------------------------------------
list:
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$'

# List of targets that don't correspond to a file/directory.
.PHONY: default install watch clean verify test lint list %.test.ts FORCE

# Prevents make from treating test file targets as intermediate files. Prevents deletion.
.PRECIOUS: %.test.ts

node_modules: package.json
	npm install
	@touch node_modules 		# ensures the timestamp for node_modules is updated
