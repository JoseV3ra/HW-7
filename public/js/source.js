$(function () {
    // *********************************************************************
    // Feel free to modify/remove the JS objects below.
    // *********************************************************************
$("button").button();

    $("#dashboardTabs").tabs();

    $("#accordion").accordion({
        collapsible: true,
        heightStyle: "content"
    });

    $(".nav-button").on("click", function () {
        const section = $(this).data("section");

        if (section === "customers") {
            document.getElementById("customers").scrollIntoView();
        } else if (section === "reports") {
            $("#dashboardTabs").tabs("option", "active", 1);
            document.getElementById("dashboardTabs").scrollIntoView();
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
});