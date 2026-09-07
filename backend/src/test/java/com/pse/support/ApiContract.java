package com.pse.support;

/**
 * Protocol-level answers this API gives that are wrong but pinned, held in one place so a
 * decision to fix one is a single edit rather than a search across the suite.
 *
 * <p>Both live here rather than in the test that sweeps them because other suites assert
 * them incidentally -- {@link com.pse.AdminApiPathSplitTests} depends on
 * {@link #WRONG_VERB_STATUS} to describe an unrelated routing fact.
 */
public final class ApiContract {

    /**
     * A path that exists, called with a verb it does not map -- F-16 in
     * docs/test-findings.md. Should be 405 with an {@code Allow} header;
     * {@code GlobalExceptionHandler.handleWrongMethod} answers 404 "Not found".
     */
    public static final int WRONG_VERB_STATUS = 404;

    /**
     * A body in a media type the handler cannot read -- F-17. Should be 415; there is no
     * {@code @ExceptionHandler} for {@code HttpMediaTypeNotSupportedException}, so the
     * catch-all answers 500.
     */
    public static final int UNSUPPORTED_MEDIA_TYPE_STATUS = 500;

    private ApiContract() {
    }
}
