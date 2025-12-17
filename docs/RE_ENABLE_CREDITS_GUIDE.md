# Credit Deduction and Paywall Re-enablement Guide

This document outlines the steps to re-enable credit deduction and the paywall functionality in the application. These features were temporarily disabled for testing purposes.

## 1. Locate the Configuration Flag

The primary control for disabling/enabling these features is a single flag:
`DISABLE_CREDIT_DEDUCTION`

This flag is located in:
`c:\c3talk\config.ts`

## 2. Re-enable Credit Deduction and Paywall

To re-enable credit deduction and the paywall:

1.  Open the file `c:\c3talk\config.ts`.
2.  Change the value of `DISABLE_CREDIT_DEDUCTION` from `true` to `false`:

    ```typescript
    export const DISABLE_CREDIT_DEDUCTION = false;
    ```

## 3. Verification

After making the change, perform the following checks to ensure the features are re-enabled correctly:

*   **Credit Deduction:**
    *   Perform a text translation, voice transcription, or voice translation.
    *   Verify that your credit balance is reduced after the operation.
*   **Paywall Trigger:**
    *   If your credit balance is zero or insufficient for an operation, verify that the paywall is displayed as expected.

## 4. Affected Files

The following files were modified to incorporate this flag:

*   `c:\c3talk\services\creditService.ts`: The `deductCredits` function now checks `DISABLE_CREDIT_DEDUCTION`.
*   `c:\c3talk\components\VoiceFlow.tsx`: The `Paywall` component rendering and "insufficient credits" error handling are conditional on `DISABLE_CREDIT_DEDUCTION`.
*   `c:\c3talk\components\TextFlow.tsx`: The `Paywall` component rendering and "insufficient credits" error handling are conditional on `DISABLE_CREDIT_DEDUCTION`.
