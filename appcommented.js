//jshint esversion:6

// Require necessary NPM modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// Initialize the express application
const app = express();

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Configure body-parser to parse request bodies and serve static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to a MongoDB database named todolistDB
mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true });

// Define a schema for items in the todo list
const itemsSchema = {
    name: String
};

// Create a model based on the items schema
const Item = mongoose.model("Item", itemsSchema);

// Create default items to be inserted into the database
const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Define a schema for different lists that can have different items
const listSchema = {
    name: String,
    items: [itemsSchema]
};

// Create a model for lists based on the list schema
const List = mongoose.model("List", listSchema);

// Handle GET requests to the home route. The default list
app.get("/", function (req, res) {
    // Find all items in the database
    Item.find({}, function (err, foundItems) {

        if (err) {
            console.log(err);
            return res.status(500).send("Error retrieving items.");
        } else {
            // If no items are found, insert the default items and redirect to home
            console.log(foundItems);
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully saved default items to DB.");
                        res.redirect("/");
                    }
                });

            } else {
                // If items are found, render the 'list' template with the found items
                res.render("list", { listTitle: "Today", newListItems: foundItems });
            }
        }
    });
});

// Handle GET requests for custom list names
app.get("/:customListName", function (req, res) {
    // Capitalize the custom list name to maintain consistency
    const customListName = _.capitalize(req.params.customListName);

    // Find one list with the custom list name, or create it if it doesn't exist
    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create and save a new list with the default items if it doesn't exist
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // If the list exists, render it with its items
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });
});

// Handle POST requests to add a new item to a list
app.post("/", function (req, res) {
    // Extract the new item's name and the list to which it should be added from the request body
    const itemName = req.body.newItem;
    const listName = req.body.list;

    // Create a new item with the given name
    const item = new Item({
        name: itemName
    });

    // If the item is to be added to the default list, save it and redirect to home
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        // If the item is to be added to a custom list, find the list and push the new item into its items array
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

// Handle POST requests to delete an item from a list
app.post("/delete", function (req, res) {
    // Extract the ID of the item to delete and the list's name from the request body
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    // If the item is from the default list, delete it directly
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    } else {
        // If the item is from a custom list, find the list and remove the item using the $pull operator
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

// Handle GET requests to the about page
app.get("/about", function (req, res) {
    res.render("about");
});

// Start the server on port 3000
app.listen(3000, function () {
    console.log("Server started on port 3000");
});
