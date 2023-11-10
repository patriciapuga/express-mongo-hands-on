// When a POST request is made to the '/delete' route, this function is called.
app.post("/delete", function (req, res) {
    // The ID of the item to be deleted is retrieved from the body of the POST request.
    // This is the value that was sent when the checkbox was checked and the form was submitted.
    const checkedItemId = req.body.checkbox;

    // The name of the list from which the item should be deleted is also retrieved from the body.
    // This determines whether the item is from the default list or a custom list.
    const listName = req.body.listName;

    // If the item is from the default list (named "Today"), then the following block is executed.
    if (listName === "Today") {
        // Mongoose's findByIdAndRemove method is called to delete the item by its ID from the database.
        Item.findByIdAndRemove(checkedItemId, function (err) {
            // If there is no error in the deletion process, a log is printed to the console.
            if (!err) {
                console.log("Successfully deleted checked item.");
                // The user is then redirected to the home route, where the list is shown without the deleted item.
                res.redirect("/");
            }
        });
    } else {
        // If the item is not from the default list, then it is part of a custom list.
        // findOneAndUpdate method of Mongoose is used to find the custom list and update it.
        // The $pull operator is used in the update parameter to remove the item from the items array.
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
            // If there is no error in the update process, the user is redirected to the custom list's page.
            // This will show the updated list without the deleted item.
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});
