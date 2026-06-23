package com.pse.shared.util;

public class Utility {

    private static final String[] ADJECTIVES = {
            "Schneller", "Mutiger", "Schlauer", "Frecher",
            "Tapferer", "Wilder", "Flinker", "Lustiger",
            "Starker", "Leiser", "Neugieriger", "Kluger",
            "Gelassener", "Kreativer", "Freundlicher", "Treuer",
            "Furchtloser", "Gewiefter", "Eleganter", "Beharrlicher",
            "Listiger", "Wachsamer", "Robuster", "Verspielter",
            "Charmanter", "Geduldiger", "Eifriger", "Zuverlaessiger",
            "Kuehner", "Besonnener", "Strahlender", "Froehlicher",
            "Entschlossener", "Geheimnisvoller", "Ausdauernder", "Geschickter",
            "Aufmerksamer", "Lebhafter", "Faszinierender", "Legendärer"
    };

    private static final String[] ANIMALS = {
            "Fuchs", "Dachs", "Otter", "Wolf",
            "Falke", "Marder", "Pinguin", "Baer",
            "Igel", "Adler", "Rabe", "Biber",
            "Elch", "Specht", "Luchs", "Hase",
            "Eule", "Habicht", "Moewe", "Kranich",
            "Waschbaer", "Eichhoernchen", "Wildschwein", "Hirsch",
            "Reh", "Murmeltier", "Amsel", "Schwan",
            "Frettchen", "Delfin", "Orca", "Seehund",
            "Puma", "Leopard", "Tiger", "Panther",
            "Loewe", "Jaguar", "Gecko", "Chamäleon",
            "Pavian", "Koala", "Känguru", "Wombat",
            "Pelikan", "Albatros", "Pinguin", "Papagei"
    };

    public static String generateUsername() {

        String adjective =
                ADJECTIVES[(int) (Math.random() * ADJECTIVES.length)];

        String animal =
                ANIMALS[(int) (Math.random() * ANIMALS.length)];

        int number = (int) (Math.random() * 10000);

        return adjective + animal + number;
    }


}
