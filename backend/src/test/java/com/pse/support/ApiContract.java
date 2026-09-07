package com.pse.support;

/**
 * Protocol-level answers this API gives, held in one place so a decision to change one is a
 * single edit rather than a search across the suite.
 *
 * <p>They live here rather than in the test that sweeps them because other suites assert
 * them incidentally -- {@link com.pse.AdminApiPathSplitTests} depends on
 * {@link #WRONG_VERB_STATUS} to describe an unrelated routing fact.
 *
 * <p>{@link #UNSUPPORTED_MEDIA_TYPE_STATUS} has been corrected to 415 and is now the right
 * answer; {@link #WRONG_VERB_STATUS} is still the wrong one, pinned deliberately.
 */
public final class ApiContract {

    /**
     * A path that exists, called with a verb it does not map -- F-16 in
     * docs/test-findings.md. Should be 405 with an {@code Allow} header;
     * {@code GlobalExceptionHandler.handleWrongMethod} answers 404 "Not found".
     */
    public static final int WRONG_VERB_STATUS = 404;

    /**
     * A body in a media type the handler cannot read -- F-17, now fixed.
     * {@code GlobalExceptionHandler.handleUnsupportedMediaType} answers 415 with the
     * project's {@code BasicResponse} shape. Kept as a constant rather than inlined
     * because the sweep that reads it covers 37 routes and the value is the contract.
     */
    public static final int UNSUPPORTED_MEDIA_TYPE_STATUS = 415;

    private ApiContract() {
    }
}
