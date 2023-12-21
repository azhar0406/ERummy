/*
 * Handlers for Incoming Socket Data
 */

handle.connected = (data) => { // Handle join
  sendData({
    cmd: 'join'
  });
}

handle.exit = (data) => { // Handle Exir
  window.location.href = "/";
}

handle.cards = (data) => { // Handle initial cards/layout

  for (let card of data.cards) {
    $("#cards").append(`<div class="card _${card.rank} ${card.suit} myhand"></div>`);
    hand.push(card);
  }

  for (let card of data.draw) {
    $("#cards").append(`<div class="card _${card.rank} ${card.suit}"></div>`);
    draw.push(card);
  }

  for (let meld of data.melds) {
    for (let card of meld) {
      $("#cards").append(`<div class="card _${card.rank} ${card.suit}"></div>`);
    }
    melds.push(meld);
  }

  // Create fake cards to prevent cheating (by people who inspect element to see opponents cards)
  ophand = createFakeCards('ophand', data.opcards);
  deck = createFakeCards('deck', data.deck);

  renderHand(hand);
  renderHand(ophand, flip=true);
  renderDeck(deck, left=true);
  renderDeck(draw);
  renderMelds(melds);
  renderHint();

  setGlow($('.ophand'), 15, '#FFD700');
  setGlow($('.myhand'), 15, '#005bf9');

  setClickHandle();

  if(data.myturn) {
    $('#hints').html('<div class="game-hints-container"><div class="game-hints-title">Game Hints</div><div class="hint-text"><img src="../../mouse-left-button.png" alt="Left Click" class="left-click-icon">to select a card from the middle</div></div>');
  } else {
    $('#hints').html('<h4>Opponents Turn...</h4>');
  }

}

handle.draw = (data) => { // Handle draw

  let nextCard = {};

  if (data.from == 'deck') { // Where From
    nextCard = deck.pop();
  } else {
    nextCard = draw.pop();
  }

  if (data.player == 'me') { // Who
    $(nextCard.html).attr('class', `card _${data.card.rank} ${data.card.suit} myhand`);
    hand.push(data.card);
    renderHand(hand);
    $('#hints').html('<div class="game-hints-container"><div class="game-hints-title">Game Hints</div><div class="hint-text"><img src="../../right-click-of-the-mouse.png" alt="Right Click" class="right-click-icon">your hand to create a meld or <br><br> <img src="../../mouse-left-button.png" alt="Left Click" class="right-click-icon">to discard a card and end your turn</div></div>');
    // $('#hints').html('<h4>Right Click your hand <br> to create a meld or <br> Left Click to discard <br> a card and end your turn</h4>');
  } else {
    $(nextCard.html).attr('class', `card ophand fake_${ophand.length} unknown`);
    ophand.push({
      html: `.card.fake_${ophand.length}.ophand`,
      suit: 'none',
      rank: 'none'
    });
    renderHand(ophand, flip=true);
  }

  setGlow($('.ophand'), 15, '#FFD700');
  setGlow($('.myhand'), 15, '#005bf9');

}

handle.discard = (data) => { // Handle discard

  if (data.player == 'me') { // Who
    hand.splice(hand.indexOf(getCard(hand, data.card)), 1);
    $(data.card.html).attr('class', `card _${data.card.rank} ${data.card.suit}`);
    draw.push(data.card);
    renderHand(hand);
    renderDeck(draw);
    $('#hints').html('<h4>Opponents Turn...</h4>');
  } else {
    let nextCard = ophand.pop();
    $(nextCard.html).attr('class', `card _${data.card.rank} ${data.card.suit}`);
    draw.push(data.card);
    renderHand(ophand, flip=true);
    renderDeck(draw);
    $('#hints').html('<div class="game-hints-container"><div class="game-hints-title">Game Hints</div><div class="hint-text"><img src="../../mouse-left-button.png" alt="Left Click" class="left-click-icon">to select a card from the middle</div></div>');
  }

  setGlow($('.ophand'), 15, '#FFD700');
  setGlow($('.myhand'), 15, '#005bf9');

}

handle.newmeld = (data) => { // Handles creation of a new meld

  if (data.player == 'me') { // Who
    for(let card of data.meld) {
      hand.splice(hand.indexOf(getCard(hand, card)), 1);
    }
    melds.push(data.meld);
    renderHand(hand);
    renderMelds(melds);
  } else {
    for(let card of data.meld) {
      let nextCard = ophand.pop();
      $(nextCard.html).attr('class', `card _${card.rank} ${card.suit}`);
    }
    melds.push(data.meld);
    renderHand(ophand, flip=true);
    renderMelds(melds);
  }

}

handle.addmeld = (data) => { // Handles the edit of a previous meld

  if (data.player == 'me') { // Who
    hand.splice(hand.indexOf(getCard(hand, data.card)), 1);
    melds[data.index] = data.meld;
    renderHand(hand);
    renderMelds(melds);
  } else {
    let nextCard = ophand.pop();
    $(nextCard.html).attr('class', `card _${data.card.rank} ${data.card.suit}`);
    melds[data.index] = data.meld;
    renderHand(ophand, flip=true);
    renderMelds(melds);
  }

}

handle.win = (data) => { // Handle win
  $('#alert').attr('class', 'alert alert-success');
  $('#alert').html(`<h4 class="alert-heading">You Won! Score: ${data.score}</h4><p id="exitmsg"></p>`);
  $('#alert').fadeToggle();
  $('.card').unbind('click');
  showConfetti();
  beginLeave();
}

handle.loss = (data) => { // Handle loss
  $('#alert').attr('class', 'alert alert-danger');
  $('#alert').html('<h4 class="alert-heading">You Lost!</h4><p id="exitmsg"></p>');
  $('#alert').fadeToggle();
  $('.card').unbind('click');
  beginLeave();
}
