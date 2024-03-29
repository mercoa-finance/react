import { InvoiceDetails, MercoaButton, MercoaSession } from "@mercoa/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Bills() {
  const router = useRouter();

  const invoiceId = router.query.invoiceId as string;

  const [mercoaToken, setMercoaToken] = useState<string>();

  useEffect(() => {
    fetch("/api/getMercoaToken")
      .then((res) => res.text())
      .then((data) => {
        setMercoaToken(data);
      });
  });

  if (!mercoaToken) return <div>loading...</div>;

  return (
    <MercoaSession token={mercoaToken}>
      <div className="container m-auto mt-10">
        <MercoaButton
          isEmphasized={false}
          type="button"
          className="mercoa-ml-2 mercoa-inline-flex mercoa-text-sm"
          onClick={() => {
            router.push(`/bills`);
          }}
        >
          <span className="mercoa-hidden md:mercoa-inline-block">Back</span>
        </MercoaButton>
        <InvoiceDetails
          invoiceId={invoiceId === "new" ? undefined : invoiceId}
          onRedirect={(invoice) => {
            if (invoice) router.push(`/bills/${invoice.id}`);
          }}
        />
      </div>
    </MercoaSession>
  );
}
