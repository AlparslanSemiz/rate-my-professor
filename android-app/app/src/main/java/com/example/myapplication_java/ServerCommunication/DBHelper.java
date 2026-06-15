package com.example.myapplication_java.ServerCommunication;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import androidx.annotation.Nullable;

public class DBHelper extends SQLiteOpenHelper {
    public static final String PROFESSOR_TABLE = "PROFESSORS";
    public static final String COLUMN_PROFESSOR_NAME = "NAME";
    public static final String COLUMN_PROFESSOR_ID = "ID";
    public static final String COLUMN_PROFESSOR_DEPARTMENT = "DEPARTMENT";
    public static final String LECTURE_TABLE = "LECTURES";
    public static final String COLUMN_LECTURE_MODULE_CODE = "MODULE_CODE";
    public static final String COLUMN_LECTURE_ID = "ID";
    public static final String COLUMN_LECTURE_TITLE = "TITLE";
    public static final String COLUMN_LECTURE_DESCRIPTION = "DESCRIPTION";

    public DBHelper(@Nullable Context context) {
        super(context, "ratemyprofessor.db", null, 1);

    }
    @Override
    public void onCreate(SQLiteDatabase db) {
        String createProfTableStatement = "CREATE TABLE " + PROFESSOR_TABLE + " (" +
                COLUMN_PROFESSOR_ID + " TEXT PRIMARY KEY, " +
                COLUMN_PROFESSOR_NAME + " TEXT, " +
                COLUMN_PROFESSOR_DEPARTMENT + " TEXT)";
        db.execSQL(createProfTableStatement);

        String createLectureTableStatement = "CREATE TABLE " + LECTURE_TABLE + " (" +
                COLUMN_LECTURE_ID + " TEXT PRIMARY KEY, " +
                COLUMN_LECTURE_TITLE + " TEXT, " +
                COLUMN_LECTURE_MODULE_CODE + " TEXT, " +
                COLUMN_LECTURE_DESCRIPTION + " TEXT)";
        db.execSQL(createLectureTableStatement);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {

    }
}
