package com.example.myapplication_java.Adapters;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.ServerCommunication.DBHelper;

import java.util.ArrayList;
import java.util.List;

public class SearchService {
    private DBHelper helper;
    public SearchService (Context context) {
        helper = new DBHelper(context);
    }

    public ArrayList<Professor> searchProfessors(String query) {
        ArrayList<Professor> professors = new ArrayList<>();
        SQLiteDatabase db = helper.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT * FROM " + DBHelper.PROFESSOR_TABLE + " WHERE " +
                DBHelper.COLUMN_PROFESSOR_NAME + " LIKE ? ORDER BY " +
                DBHelper.COLUMN_PROFESSOR_NAME + " ASC ", new String[]{"%" + query + "%"});

        if (cursor.moveToFirst()){
            do {
                String id = cursor.getString(cursor.getColumnIndexOrThrow(DBHelper.COLUMN_PROFESSOR_ID));
                String name = cursor.getString(cursor.getColumnIndexOrThrow(DBHelper.COLUMN_PROFESSOR_NAME));
                String department = cursor.getString(cursor.getColumnIndexOrThrow(DBHelper.COLUMN_PROFESSOR_DEPARTMENT));
                Professor professor = new Professor(id, name, department);
                professors.add(professor);
                Log.println(Log.DEBUG, "Professor attribute", id + " " + name + " " + department);
            } while (cursor.moveToNext());
        }
        cursor.close();
        return professors;
    }

    public void setMockDatabase() {
        SQLiteDatabase db = helper.getWritableDatabase();
        db.execSQL("DELETE FROM " + DBHelper.PROFESSOR_TABLE);
        insert("001", "Mustafa", "Mathematik");
        insert("002", "Erik", "Informatik");
        insert("003", "Stefan", "Mathematik");
        insert("004", "Linda", "Geologie");
        insert("005", "Paul", "Lehramt");
        insert("006", "Qaul", "Lehramt");
        insert("007", "Raul", "Lehramt");
        insert("008", "Saul", "Lehramt");
        insert("009", "Taul", "Lehramt");
        insert("010", "Uaul", "Lehramt");
        insert("011", "Vaul", "Lehramt");
        insert("012", "Waul", "Lehramt");
        insert("013", "Xaul", "Lehramt");
    }

    //BAD METHOD FIX IN THE FUTURE
    public void insert(String id, String name, String department) {
        String mockDataQuery = "INSERT INTO " + DBHelper.PROFESSOR_TABLE + "("+
                DBHelper.COLUMN_PROFESSOR_ID + ", " +
                DBHelper.COLUMN_PROFESSOR_NAME + ", " +
                DBHelper.COLUMN_PROFESSOR_DEPARTMENT + ")"
                + " VALUES " +
                "('" + id + "', '" + name + "', '" + department + "')";
        SQLiteDatabase db = helper.getWritableDatabase();
        db.execSQL(mockDataQuery);
        db.close();
    }

    public List<Lecture> searchLectures(String query) {
        ArrayList<Lecture> lectures = new ArrayList<>();
        SQLiteDatabase db = helper.getReadableDatabase();

        Cursor cursor = db.rawQuery(
                "SELECT * FROM " + DBHelper.LECTURE_TABLE +
                        " WHERE " + DBHelper.COLUMN_LECTURE_TITLE + " LIKE ?" +
                        " ORDER BY " + DBHelper.COLUMN_LECTURE_TITLE + " ASC",
                new String[]{"%" + query + "%"}
        );

        if (cursor.moveToFirst()) {
            do {
                String id = cursor.getString(
                        cursor.getColumnIndexOrThrow(DBHelper.COLUMN_LECTURE_ID)
                );
                String title = cursor.getString(
                        cursor.getColumnIndexOrThrow(DBHelper.COLUMN_LECTURE_TITLE)
                );
                String moduleCode = cursor.getString(
                        cursor.getColumnIndexOrThrow(DBHelper.COLUMN_LECTURE_MODULE_CODE)
                );
                String description = cursor.getString(
                        cursor.getColumnIndexOrThrow(DBHelper.COLUMN_LECTURE_DESCRIPTION)
                );

                Lecture lecture = new Lecture(id, title, moduleCode, description);
                lectures.add(lecture);

            } while (cursor.moveToNext());
        }

        cursor.close();
        return lectures;
    }
}
