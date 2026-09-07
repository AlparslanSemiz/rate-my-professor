package com.pse.shared.util;

public final class NameGenerator {

    private static final String[] ADJECTIVES = {
            "Swift", "Brave", "Quick", "Smart", "Bold",
            "Calm", "Sly", "Wild", "Proud", "Jolly",
            "Eager", "Loyal", "Alert", "Sharp", "Tough",
            "Merry", "Quiet", "Sunny", "Witty", "Noble",
            "Lucky", "Happy", "Keen", "Chill", "Fresh",
            "Grand", "Light", "Vivid", "Crisp", "Zesty",
            "Funky", "Solid", "Agile", "Rapid", "Cool",
            "Epic", "Fancy", "Fuzzy", "Magic", "Misty",
            "Sandy", "Snowy", "Dizzy", "Hyper", "Jumpy",
            "Nifty", "Royal", "Bright", "Gentle", "Mighty",
            "Clever", "Joyful", "Silent", "Playful", "Curious",
            "Daring", "Honest", "Kindly", "Smooth", "Steady",
            "Cosmic", "Golden", "Silver", "Fierce", "Nimble",
            "Cheery", "Rustic", "Breezy", "Glowy", "Lively",
            "Dreamy", "Stormy", "Shiny", "Speedy", "Tiny",
            "Small", "Big", "Young", "Old", "Warm",
            "Cold", "Sweet", "Spicy", "Salty", "Soft",
            "Hard", "Round", "Neat", "Wavy", "Dusty",
            "Icy", "Frosty", "Windy", "Cloudy", "Rainy",
            "Leafy", "Earthy", "Rocky", "Mellow", "Snappy",
            "Peppy", "Bouncy", "Sleepy", "Snoozy", "Goofy",
            "Silly", "Jazzy", "Snug", "Cozy", "Plucky",
            "Zippy", "Sassy", "Chirpy", "Perky", "Grumpy",
            "Tender", "Fiery", "Lunar", "Solar", "Amber",
            "Azure", "Coral", "Velvet", "Minty", "Peachy"
    };

    private static final String[] ANIMALS = {
            "Fox", "Wolf", "Otter", "Bear", "Eagle",
            "Raven", "Bison", "Moose", "Lynx", "Hare",
            "Owl", "Puma", "Tiger", "Gecko", "Orca",
            "Shark", "Whale", "Cobra", "Horse", "Zebra",
            "Koala", "Panda", "Camel", "Lemur", "Rhino",
            "Robin", "Finch", "Swan", "Duck", "Goose",
            "Crane", "Sloth", "Sheep", "Goat", "Mouse",
            "Toad", "Frog", "Mole", "Crow", "Dingo",
            "Skunk", "Viper", "Squid", "Trout", "Moth",
            "Bee", "Ant", "Crab", "Snail", "Falcon",
            "Hawk", "Deer", "Boar", "Seal", "Badger",
            "Beaver", "Ferret", "Jaguar", "Lion", "Parrot",
            "Pelican", "Heron", "Stork", "Yak", "Mink",
            "Rabbit", "Lizard", "Turtle", "Monkey", "Gorilla",
            "Donkey", "Alpaca", "Buffalo", "Penguin", "Salmon",
            "Spider", "Wombat", "Weasel", "Gazelle", "Cat",
            "Dog", "Rat", "Bat", "Eel", "Ape",
            "Elk", "Emu", "Ibis", "Kiwi", "Mule",
            "Newt", "Prawn", "Roach", "Slug", "Tick",
            "Wasp", "Midge", "Mantis", "Locust", "Cicada",
            "Beetle", "Hornet", "Termite", "Magpie", "Pigeon",
            "Sparrow", "Toucan", "Grouse", "Quail", "Gull",
            "Shrew", "Stoat", "Hyena", "Jackal", "Coyote",
            "Marmot", "Possum", "Walrus", "Manatee", "Narwhal",
            "Dugong", "Marlin", "Perch", "Carp", "Pike",
            "Tuna", "Cod", "Bass", "Ray", "Shrimp",
            "Lobster", "Oyster", "Clam", "Mussel", "Gibbon"
    };

    private NameGenerator() {
    }

    public static String generateUsername() {

        String adjective =
                ADJECTIVES[(int) (Math.random() * ADJECTIVES.length)];

        String animal =
                ANIMALS[(int) (Math.random() * ANIMALS.length)];

        return adjective + animal;
    }
}