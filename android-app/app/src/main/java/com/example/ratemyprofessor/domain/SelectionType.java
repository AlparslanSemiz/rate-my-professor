package com.example.ratemyprofessor.domain;

/**
 * What a selection screen lists, professors or lectures.
 *
 * <p>The search screen shows one tab per constant, in the order declared here. Adding a
 * constant therefore adds a tab, see
 * {@link com.example.ratemyprofessor.adapters.SearchPagerAdapter}.</p>
 */
public enum SelectionType {

    /**
     * List of professors.
     */
    PROFESSORS,

    /**
     * List of lectures.
     */
    LECTURES

}
