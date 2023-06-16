//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();


app.set('view engine', 'ejs'); // This will access the views tab and display the ejs templates

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connecting to the new Database 
mongoose.connect ("mongodb+srv://admin-Seni:Rebook12@cluster0.xecj9rl.mongodb.net/todolistDB",{
useNewUrlParser:true
});

// Create the items Schema
const itemSchema = new mongoose.Schema({
  name: String
})

// Creating the item Model
const itemModel = mongoose.model("item", itemSchema); //"item" must be singular form of the collection

// Create the documents (items)
const item1 = new itemModel({
  name: "Welcome to your todolist"
});

const item2 = new itemModel({
  name: "Tap + button to add item"
});

const item3 = new itemModel({
  name: "Click Checkbox to delete"
});

const defaultItems = [item1, item2, item3];

// Insert all the items inside the database
// itemModel.insertMany(defaultItems);

// Create function to find all items to be used in the DB

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", async function(req, res) {
  try {
    const foundItems = await itemModel.find({}).exec();

    if (foundItems.length === 0) {
      await itemModel.insertMany(defaultItems);
      console.log("Successfully saved default items to DB.");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
    // Handle the error appropriately
  }
});

app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) await new List({ name: customListName, items: defaultItems }).save();
    res.render("list", { listTitle: foundList?.name || customListName, newListItems: foundList?.items || defaultItems });
  } catch (err) {
    console.log(err);
    // Handle the error appropriately
  }
});

app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new itemModel({
    name: itemName
  });

  try {
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.log(err);
    // Handle the error appropriately
  }
});
  
//   item.save()     // Saving the item into the database collection
//   res.redirect("/");
// });

// Deleting an item from your custom form through express route parameters

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await itemModel.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    } else {
      await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
      //$Pull operator is used to remove the item from the array with MongoDBshow collections

      res.redirect("/" + listName);
    }
  } catch (err) {
    console.log(err);
    // Handle the error appropriately
  }
});

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
