package com.example.ratemyprofessor.adapters;

import androidx.room.TypeConverter;

import java.time.LocalDateTime;

/**
 * Converts local date-time values to and from strings for Room storage.
 */
public class LocalDateTimeConverter {
    /**
     * Serializes a local date and time using its ISO-8601 string representation.
     *
     * @param dateTime the date and time to serialize, or null
     * @return the ISO-8601 representation, or null if the input is null
     */
    @TypeConverter
    public static String fromLocalDateTime(LocalDateTime dateTime) {
        return dateTime == null ? null : dateTime.toString();
    }

    /**
     * Parses an ISO-8601 local date-time string.
     *
     * @param value the ISO-8601 date-time string to parse, or null
     * @return the parsed local date and time, or null if the input is null
     * @throws java.time.format.DateTimeParseException if the value is not a valid local date-time string
     */
    @TypeConverter
    public static LocalDateTime toLocalDateTime(String value) {
        return value == null ? null : LocalDateTime.parse(value);
    }
}
