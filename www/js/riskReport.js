$(document).on("click", "#submit_btn", function(event){
    alert( "GO" ); 
});

$(document).on("click", ".card", function(event){
//$('.card').on('click', (function(){
  $('.card').removeClass('cardclicked');
  $(this).addClass('cardclicked');
  $('.closeb').fadeIn();
});

$(document).on("click", ".cardclicked", function(event){
//$('.cardclicked').on('click', (function(){
  $(this).removeClass('cardclicked');
});

$(document).on("click", "core-icon-button", function(event){
//$('core-icon-button').on('click', (function(){
  $('.card').removeClass('cardclicked');
  $('.closeb').fadeOut();
});