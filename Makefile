# Define variables
COMPONENTS_DIR := ./src/components
ORIGINAL_DIR := ../core/components/@mercoa/react/src/components
FILES := $(shell find $(COMPONENTS_DIR) -type f)

# Copy Components
copy_components:
	@echo "Copying Components..."
	rsync -av $(ORIGINAL_DIR) ./src/

## rsync -av --exclude='Mercoa.tsx' $(ORIGINAL_DIR) ./src/

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
.PHONY: replace_string

sync: copy_components replace_import prettier