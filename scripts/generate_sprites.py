"""Generate original, simple pixel-art sprites for Tiny Teamwork: The Last Spark."""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'sprites'
OUT.mkdir(parents=True, exist_ok=True)
OUTLINE = '#172038'


def save_human(name, jacket, scarf, hair, skin, pants):
    im = Image.new('RGBA', (16, 24), (0,0,0,0)); d = ImageDraw.Draw(im)
    # shadow pixels
    d.rectangle((3,21,12,22), fill='#101522')
    # boots and legs
    d.rectangle((4,18,7,21), fill=pants); d.rectangle((9,18,12,21), fill=pants)
    d.rectangle((3,21,7,22), fill=OUTLINE); d.rectangle((9,21,13,22), fill=OUTLINE)
    d.rectangle((4,21,6,21), fill='#c6c4be'); d.rectangle((10,21,12,21), fill='#c6c4be')
    # body silhouette
    d.rectangle((3,10,12,18), fill=OUTLINE)
    d.rectangle((4,11,11,17), fill=jacket)
    d.rectangle((4,13,5,16), fill='#ffffff')
    d.rectangle((10,12,11,15), fill=shade(jacket, -22))
    d.rectangle((6,13,9,15), fill=scarf)
    # arms
    d.rectangle((1,12,3,16), fill=OUTLINE); d.rectangle((2,12,3,15), fill=jacket)
    d.rectangle((12,12,14,16), fill=OUTLINE); d.rectangle((12,12,13,15), fill=jacket)
    d.point((2,16), fill=skin); d.point((13,16), fill=skin)
    # neck and head
    d.rectangle((6,8,9,11), fill=skin)
    d.rectangle((4,3,11,9), fill=OUTLINE)
    d.rectangle((5,4,10,8), fill=skin)
    d.rectangle((4,5,5,7), fill=shade(skin, -20)); d.rectangle((10,6,11,7), fill=shade(skin, -15))
    # hair
    d.rectangle((4,2,11,4), fill=OUTLINE)
    d.rectangle((5,1,10,3), fill=hair)
    d.rectangle((4,3,5,5), fill=hair)
    d.rectangle((9,2,11,3), fill=shade(hair, -22))
    # expressive eye pixels
    d.point((7,6), fill=OUTLINE); d.point((9,6), fill=OUTLINE)
    d.point((7,5), fill='#ffffff'); d.point((9,5), fill='#ffffff')
    # small hair highlight and strap
    d.line((6,11,8,14), fill=shade(jacket, -36), width=1)
    return im


def shade(hexcolor, amount):
    h = hexcolor.lstrip('#'); r,g,b = [int(h[i:i+2], 16) for i in (0,2,4)]
    r=max(0,min(255,r+amount)); g=max(0,min(255,g+amount)); b=max(0,min(255,b+amount))
    return f'#{r:02x}{g:02x}{b:02x}'


def make_sentinel():
    im=Image.new('RGBA',(20,28),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.ellipse((4,24,16,26),fill='#101522')
    # legs
    d.rectangle((5,19,8,24),fill=OUTLINE); d.rectangle((12,19,15,24),fill=OUTLINE)
    d.rectangle((6,20,7,23),fill='#667b8c'); d.rectangle((13,20,14,23),fill='#667b8c')
    # arms and body
    d.rectangle((1,9,4,18),fill=OUTLINE); d.rectangle((2,10,4,16),fill='#718596')
    d.rectangle((15,9,18,18),fill=OUTLINE); d.rectangle((15,10,17,16),fill='#718596')
    d.rectangle((4,8,16,20),fill=OUTLINE); d.rectangle((5,9,15,19),fill='#8a9ba6')
    d.rectangle((6,10,14,17),fill='#536c7e')
    d.rectangle((7,11,12,14),fill='#d34e53'); d.rectangle((8,12,11,13),fill='#ff9a77')
    d.rectangle((5,15,15,17),fill='#2f465c')
    # head
    d.rectangle((4,2,16,10),fill=OUTLINE); d.rectangle((5,3,15,8),fill='#aeb8b9')
    d.rectangle((6,4,14,7),fill='#536c7e'); d.rectangle((7,5,13,6),fill='#d34e53')
    d.point((8,5),fill='#fff0c0'); d.point((12,5),fill='#fff0c0')
    d.rectangle((2,5,4,8),fill='#3e5c73'); d.rectangle((16,5,18,8),fill='#3e5c73')
    d.rectangle((8,1,12,2),fill='#d34e53')
    return im


def make_flyer():
    im=Image.new('RGBA',(18,16),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rectangle((0,4,4,9),fill='#243447'); d.rectangle((13,4,17,9),fill='#243447')
    d.rectangle((1,3,3,10),fill='#647f94'); d.rectangle((14,3,16,10),fill='#647f94')
    d.rectangle((5,3,12,12),fill=OUTLINE); d.rectangle((6,4,11,11),fill='#8197a2')
    d.rectangle((7,5,10,8),fill='#2d4357'); d.rectangle((7,6,10,7),fill='#e55b61')
    d.point((8,6),fill='#fff0b2'); d.point((10,6),fill='#fff0b2')
    d.rectangle((8,12,9,14),fill='#d64c58'); d.point((8,15),fill='#f2b75c')
    return im


def make_creeper():
    im=Image.new('RGBA',(20,20),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.ellipse((3,16,17,18),fill='#101522')
    d.rectangle((3,5,16,16),fill=OUTLINE); d.rectangle((4,6,15,15),fill='#586f80')
    d.rectangle((5,7,14,13),fill='#8a9b9e')
    d.rectangle((6,8,13,11),fill='#2c3c4e'); d.rectangle((7,9,12,10),fill='#f16a55')
    d.point((8,9),fill='#fff0ba'); d.point((11,9),fill='#fff0ba')
    d.rectangle((7,2,12,5),fill=OUTLINE); d.rectangle((8,3,11,4),fill='#e25a51')
    d.rectangle((1,10,3,14),fill='#d6a456'); d.rectangle((16,10,18,14),fill='#d6a456')
    return im


def make_giant():
    im=Image.new('RGBA',(48,40),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.ellipse((4,35,44,38),fill='#080b12')
    # armored lower body
    d.rectangle((6,20,42,36),fill='#131c2c'); d.rectangle((8,22,40,34),fill='#293b50')
    d.rectangle((11,25,19,34),fill='#526a7f'); d.rectangle((29,25,37,34),fill='#526a7f')
    d.rectangle((15,28,32,34),fill='#8b463e')
    d.rectangle((2,22,9,31),fill='#131c2c'); d.rectangle((39,22,46,31),fill='#131c2c')
    d.rectangle((3,24,8,29),fill='#40576b'); d.rectangle((40,24,45,29),fill='#40576b')
    # shoulder armor
    d.rectangle((1,14,13,24),fill=OUTLINE); d.rectangle((3,16,12,22),fill='#536c7f')
    d.rectangle((35,14,47,24),fill=OUTLINE); d.rectangle((36,16,45,22),fill='#536c7f')
    # head / crown
    d.rectangle((9,5,39,22),fill=OUTLINE); d.rectangle((11,7,37,20),fill='#718795')
    d.rectangle((13,9,35,16),fill='#293b50')
    d.rectangle((14,11,22,14),fill='#e34c51'); d.rectangle((26,11,34,14),fill='#e34c51')
    d.rectangle((16,11,19,12),fill='#fff0b4'); d.rectangle((28,11,31,12),fill='#fff0b4')
    d.rectangle((18,17,30,19),fill='#111927')
    # spikes/crown
    d.polygon([(10,7),(12,0),(18,7)],fill='#344d63'); d.polygon([(20,7),(24,1),(28,7)],fill='#344d63'); d.polygon([(30,7),(36,0),(38,7)],fill='#344d63')
    d.rectangle((20,23,28,27),fill='#bf4b47'); d.rectangle((22,24,26,26),fill='#f2a05c')
    return im


def make_crate():
    im=Image.new('RGBA',(14,14),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rectangle((1,1,12,12),fill=OUTLINE); d.rectangle((2,2,11,11),fill='#a96c3e')
    d.rectangle((3,3,10,4),fill='#e4af63'); d.rectangle((3,9,10,10),fill='#74462f')
    d.line((3,3,10,10),fill='#6c4530',width=2); d.line((10,3,3,10),fill='#d49a50',width=2)
    d.rectangle((5,5,8,8),fill='#b57a45')
    return im


def make_shelter():
    im=Image.new('RGBA',(32,24),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rectangle((1,5,30,22),fill=OUTLINE); d.rectangle((3,7,28,20),fill='#47675e')
    d.rectangle((6,9,25,20),fill='#1c2d36'); d.rectangle((11,12,20,20),fill='#a9bf9b')
    d.rectangle((12,13,19,20),fill='#273c40'); d.rectangle((4,8,27,9),fill='#c4d09b')
    d.rectangle((14,2,17,6),fill='#e1c16d'); d.rectangle((13,1,18,2),fill='#e1c16d')
    return im


def save(name, im):
    im.save(OUT / name)

save('human_amber.png', save_human('amber','#c56b43','#f3c267','#493343','#d49a76','#35485a'))
save('human_cyan.png', save_human('cyan','#3e98a8','#edcf79','#252b42','#bd8768','#344e63'))
save('human_rose.png', save_human('rose','#b85878','#f1b56e','#362b43','#c68e73','#3d435c'))
save('robot_sentinel.png', make_sentinel())
save('robot_flyer.png', make_flyer())
save('robot_creeper.png', make_creeper())
save('giant_pursuer.png', make_giant())
save('crate.png', make_crate())
save('checkpoint_shelter.png', make_shelter())
print('Generated', len(list(OUT.glob('*.png'))), 'sprites in', OUT)
