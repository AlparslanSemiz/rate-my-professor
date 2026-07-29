package com.example.myapplication_java.DomainModel;

/**
 * What a selection screen lists, professors or lectures.
 *
 * <p>The search screen shows one tab per constant, in the order declared here. Adding a
 * constant therefore adds a tab, see
 * {@link com.example.myapplication_java.Adapters.SearchPagerAdapter}.</p>
 */
public enum SelectionType {

    /**
     * List of professors.
     */
    PROFESSORS,

    /**
     * List of lectures.
     */
    LECTURES;

}
