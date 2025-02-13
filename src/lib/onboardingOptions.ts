import { Mercoa } from '@mercoa/javascript'

export function onboardingOptionToResponse(onboardingOption: Mercoa.OnboardingOptionRequest | undefined) {
  const out: Mercoa.OnboardingOptionResponse = {
    show: onboardingOption?.show ?? false,
    edit: onboardingOption?.edit ?? false,
    required: onboardingOption?.required ?? false,
  }
  // required implies edit, edit implies show
  if (out.required) {
    out.edit = true
    out.show = true
  } else if (out.edit) {
    out.show = true
  }
  return out
}

export function onboardingOptionsToResponse(onboardingOptions: Mercoa.OnboardingOptionsRequest) {
  const out: Mercoa.OnboardingOptionsResponse = {
    enableBusiness: onboardingOptions?.enableBusiness ?? false,
    enableIndividual: onboardingOptions?.enableIndividual ?? false,
    paymentMethod: onboardingOptions?.paymentMethod ?? true,
    business: {
      name: onboardingOptionToResponse(onboardingOptions?.business?.name),
      address: onboardingOptionToResponse(onboardingOptions?.business?.address),
      phone: onboardingOptionToResponse(onboardingOptions?.business?.phone),
      email: onboardingOptionToResponse(onboardingOptions?.business?.email),
      ein: onboardingOptionToResponse(onboardingOptions?.business?.ein),
      mcc: onboardingOptionToResponse(onboardingOptions?.business?.mcc),
      website: onboardingOptionToResponse(onboardingOptions?.business?.website),
      description: onboardingOptionToResponse(onboardingOptions?.business?.description),
      doingBusinessAs: onboardingOptionToResponse(onboardingOptions?.business?.doingBusinessAs),
      type: onboardingOptionToResponse(onboardingOptions?.business?.type),
      formationDate: onboardingOptionToResponse(onboardingOptions?.business?.formationDate),
      representatives: onboardingOptionToResponse(onboardingOptions?.business?.representatives),
      termsOfService: onboardingOptionToResponse(onboardingOptions?.business?.termsOfService),
      logo: onboardingOptionToResponse(onboardingOptions?.business?.logo),
      averageMonthlyTransactionVolume: onboardingOptionToResponse(
        onboardingOptions?.business?.averageMonthlyTransactionVolume,
      ),
      averageTransactionSize: onboardingOptionToResponse(onboardingOptions?.business?.averageTransactionSize),
      maxTransactionSize: onboardingOptionToResponse(onboardingOptions?.business?.maxTransactionSize),
      w9: onboardingOptionToResponse(onboardingOptions?.business?.w9),
      tenNinetyNine: onboardingOptionToResponse(onboardingOptions?.business?.tenNinetyNine),
      bankStatement: onboardingOptionToResponse(onboardingOptions?.business?.bankStatement),
    },
    individual: {
      name: onboardingOptionToResponse(onboardingOptions?.individual?.name),
      address: onboardingOptionToResponse(onboardingOptions?.individual?.address),
      phone: onboardingOptionToResponse(onboardingOptions?.individual?.phone),
      email: onboardingOptionToResponse(onboardingOptions?.individual?.email),
      ssn: onboardingOptionToResponse(onboardingOptions?.individual?.ssn),
      dateOfBirth: onboardingOptionToResponse(onboardingOptions?.individual?.dateOfBirth),
      termsOfService: onboardingOptionToResponse(onboardingOptions?.individual?.termsOfService),
      w9: onboardingOptionToResponse(onboardingOptions?.individual?.w9),
      tenNinetyNine: onboardingOptionToResponse(onboardingOptions?.individual?.tenNinetyNine),
      bankStatement: onboardingOptionToResponse(onboardingOptions?.individual?.bankStatement),
    },
  }
  return out
}
