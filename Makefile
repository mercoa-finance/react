# Define variables
COMPONENTS_SRC_DIR := ./src
CORE_SRC_DIR := ../core/components/@mercoa/react/src
FILES = $(shell find $(COMPONENTS_SRC_DIR) -type f)

# Copy Components
copy_components:
	@echo "Copying Components..."
	rsync -av $(CORE_SRC_DIR)/modules ./src/
	rsync -av $(CORE_SRC_DIR)/components ./src/
	rsync -av $(CORE_SRC_DIR)/lib ./src/

## rsync -av --exclude='Mercoa.tsx' $(CORE_SRC_DIR) ./src/

# Rule to replace the string
replace_import:
		@echo "Replacing import..."
		@for file in $(FILES); do \
			sed "s/import { MercoaApi as Mercoa, MercoaApiClient as MercoaClient } from 'sdks\/typescript'/import { Mercoa, MercoaClient } from '@mercoa\/javascript'/g" "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
		done
		@for file in $(FILES); do \
			sed "s/import { MercoaApi as Mercoa } from 'sdks\/typescript'/import { Mercoa } from '@mercoa\/javascript'/g" "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
		done
		@for file in $(FILES); do \
			sed "s/import jwtDecode from 'jwt-decode'/import { jwtDecode } from 'jwt-decode'/g" "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
		done
		@for file in $(FILES); do \
			sed "s/import posthog from 'posthog-js'/ /g" "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
		done
		@for file in $(FILES); do \
			sed "s/import LogRocket from 'logrocket'/ /g" "$$file" > "$$file.tmp" && mv "$$file.tmp" "$$file"; \
		done
		@echo "String replaced successfully"

prettier:
		npm run prettier

# Define phony targets
.PHONY: copy_components replace_import prettier sync

sync: copy_components replace_import prettier