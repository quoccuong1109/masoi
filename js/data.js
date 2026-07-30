export var ROLES = {
  wolf:       {name:'Ma Sói',         emoji:'🐺', team:'wolf',    immuneSeer:false, desc:'Mỗi đêm thức dậy, cùng đồng đội chọn 1 người dân để tiêu diệt.',                                              tip:'Đừng im lặng hoàn toàn ban ngày — hãy tham gia thảo luận tự nhiên.'},
  alphawolf:  {name:'Sói Đầu Đàn',    emoji:'👑', team:'wolf',    immuneSeer:false, desc:'Nếu bị bỏ phiếu loại ban ngày, kéo thêm 1 người chết theo!',                                                  tip:'Chọn mục tiêu kéo theo thật khéo — ưu tiên Tiên Tri hoặc Thầy Thuốc.'},
  cub:        {name:'Sói Con',         emoji:'🐶', team:'wolf',    immuneSeer:false, desc:'Khi bị loại, đêm tiếp theo Ma Sói được cắn 2 người thay vì 1! (Sói Con báo thù)',                           tip:'Đứng sau các Ma Sói khác — giá trị nhất khi còn nhiều sói.'},
  whitewolf:  {name:'Sói Trắng',       emoji:'🤍', team:'wolf',    immuneSeer:false, desc:'Mỗi 2 đêm (đêm chẵn), có thể tiêu diệt thêm 1 người kể cả đồng đội. Mục tiêu: thắng một mình!',              tip:'Tiêu diệt Ma Sói đồng đội khi chỉ còn 2-3 người.'},
  humanwolf:  {name:'Người Sói',       emoji:'🧑‍🦱',team:'wolf',   immuneSeer:true,  desc:'Trông như dân làng. Tiên Tri soi ra sẽ thấy là DÂN — miễn nhiễm hoàn toàn! Vẫn thức dậy cùng Ma Sói ban đêm.',tip:'Làm thân với Tiên Tri để được soi. Đây là vũ khí tâm lý mạnh nhất!'},
  gangleader: {name:'Trùm Sói',        emoji:'🤴', team:'wolf',    immuneSeer:false, desc:'Mỗi đêm chọn 1 người — Quản trò báo người đó có phải Dân Làng thường không (không phân biệt vai đặc biệt).',  tip:'Dùng để loại trừ dân thường và tìm Tiên Tri, Phù Thủy hoặc Bảo Vệ.'},
  sorcerer:   {name:'Pháp Sư',         emoji:'🧿', team:'wolf',    immuneSeer:false, desc:'Mỗi đêm chọn 1 người — Quản trò báo người đó có phải Tiên Tri không (Có/Không). Biết ai là Tiên Tri = vô hiệu hóa được!', tip:'Ưu tiên tìm Tiên Tri — triệt hạ họ là ưu thế chiến lược lớn nhất cho phe Sói.'},
  seer:       {name:'Tiên Tri',        emoji:'🔮', team:'village', desc:'Mỗi đêm được biết 1 người là Ma Sói hay Dân làng. (Người Sói sẽ hiện là Dân!)',                                                 tip:'Không tiết lộ vai ngay. Gom thông tin 2-3 đêm rồi chia sẻ khéo léo.'},
  witch:      {name:'Phù Thủy',        emoji:'🧙', team:'village', desc:'1 lọ thuốc cứu + 1 lọ thuốc độc. Mỗi lọ dùng 1 lần.',                                                                         tip:'Giữ thuốc độc đến gần cuối. Dùng thuốc cứu đúng thời điểm.'},
  cupid:      {name:'Thần Tình Yêu',   emoji:'💘', team:'village', desc:'Đêm đầu chọn 2 người yêu nhau. Nếu 1 chết, người kia chết theo!',                                                              tip:'Kết đôi 2 dân mạnh hoặc 1 Ma Sói + 1 Dân.'},
  hunter:     {name:'Thợ Săn',         emoji:'🏹', team:'village', desc:'Khi bị loại (ngày hay đêm), ngay lập tức bắn chết 1 người khác.',                                                              tip:'Quan sát kỹ và chuẩn bị sẵn mục tiêu.'},
  guard:      {name:'Bảo Vệ',          emoji:'🛡️', team:'village', desc:'Mỗi đêm bảo vệ 1 người. Người được bảo vệ miễn nhiễm mọi tấn công. Không bảo vệ cùng người 2 đêm liên tiếp!',                tip:'Luân phiên giữa các vai quan trọng.'},
  fool:       {name:'Kẻ Ngốc',         emoji:'🃏', team:'village', desc:'Mục tiêu: bị bỏ phiếu loại ban ngày! Nếu thành công, thắng một mình!',                                                         tip:'Hành xử thật khả nghi để bị bỏ phiếu!'},
  medium:     {name:'Đồng Cốt',        emoji:'👻', team:'village', desc:'Mỗi đêm giao tiếp với 1 hồn ma để hỏi 1 câu Có/Không.',                                                                        tip:'Hỏi để xác nhận thông tin Tiên Tri.'},
  sheriff:    {name:'Cảnh Sát Trưởng', emoji:'⭐', team:'village', desc:'Phiếu bầu ban ngày gấp đôi. Có thể truyền chức trước khi chết.',                                                               tip:'Dùng quyền phiếu đôi khi tập thể đã thống nhất.'},
  priest:     {name:'Linh Mục',        emoji:'✝️', team:'village', desc:'1 lần duy nhất ban ngày "thánh hóa" 1 người — nếu là Ma Sói, bị loại ngay!',                                                   tip:'Chỉ dùng khi 90% chắc chắn đó là Ma Sói.'},
  detective:  {name:'Thám Tử',         emoji:'🕵️', team:'village', desc:'Mỗi đêm chọn 2 người — nếu có Ma Sói trong đó, Quản trò tiết lộ CHÍNH XÁC ai là Ma Sói! (Người Sói miễn nhiễm)',      tip:'Điều tra cặp đôi đáng ngờ — khi có kết quả, bạn biết chính xác ai cần loại.'},
  matchmaker: {name:'Mối Giới',        emoji:'🤝', team:'village', desc:'1 lần duy nhất trong ván: chọn 2 người yêu nhau ở bất kỳ đêm nào. Nếu 1 chết → người kia chết theo!',                         tip:'Có thể chờ đến đêm phù hợp mới ghép đôi. Bẫy Ma Sói hoặc củng cố liên minh Dân.'},
  elder:      {name:'Người Già',       emoji:'🧓', team:'village', desc:'Có 2 mạng sống: sống sót đòn cắn đầu tiên của Ma Sói ban đêm. Lần 2 bị cắn hoặc bị treo cổ ban ngày thì chết.',               tip:'Không tiết lộ vai — khiến Ma Sói lãng phí 1 đêm tấn công vô ích.'},
  wildchild:  {name:'Trẻ Em Hoang Dã',emoji:'🧒', team:'village', desc:'Đêm đầu chọn 1 người làm "hình mẫu". Nếu hình mẫu chết (bất kỳ lý do), Trẻ Em bí mật đổi sang phe Ma Sói!',                  tip:'Hình mẫu tốt nhất là người mạnh như Tiên Tri — nếu họ chết, bạn có con bài bí mật.'},
  fox:        {name:'Cáo',            emoji:'🦊', team:'village', desc:'Mỗi đêm chọn 3 người — Quản trò báo có Ma Sói trong nhóm đó không. NẾU SAI (không có sói): mất khả năng đặc biệt vĩnh viễn!', tip:'Chọn 3 người đáng ngờ nhất. Nếu kết quả "không có" — mất quyền, nhưng đã loại được 3 người khả năng!'},
  whiteWitch: {name:'Phù Thủy Trắng', emoji:'🌟', team:'village', desc:'Một lần duy nhất trong ván: đêm chọn 1 người đã chết để hồi sinh họ trở lại vào sáng hôm sau!',                               tip:'Đừng dùng quá sớm — chờ vai quan trọng như Tiên Tri hoặc Bảo Vệ bị chết.'},
  villager:   {name:'Dân Làng',        emoji:'🧑‍🌾',team:'village', desc:'Không có quyền năng đặc biệt. Quan sát, thảo luận và bỏ phiếu sáng suốt!',                                                    tip:'Chú ý người im lặng bất thường VÀ người nói quá nhiều.'},
};

export var WOLF_ROLES = ['wolf','alphawolf','cub','whitewolf','humanwolf','gangleader','sorcerer'];
export var VIL_ROLES  = ['seer','witch','cupid','hunter','guard','fool','medium','sheriff','priest','detective','matchmaker','elder','wildchild','fox','whiteWitch'];
export var SKIPPABLE  = ['wolf','wolf2','whitewolf','guard','seer','witch','cupid','medium','gangleader','detective','matchmaker','sorcerer','fox','whiteWitch'];

export var POWER = {wolf:4,alphawolf:5,cub:3,whitewolf:6,humanwolf:6,gangleader:4,sorcerer:4,seer:5,witch:4,guard:4,hunter:3,cupid:2,sheriff:2,medium:2,priest:3,fool:1,detective:4,matchmaker:2,elder:3,wildchild:2,fox:3,whiteWitch:4,villager:1};

export function calcBalance(cfg) {
  var wScore=0, vScore=0, wCount=0, vCount=0;
  WOLF_ROLES.forEach(function(k){wScore+=POWER[k]*(cfg[k]||0);wCount+=(cfg[k]||0);});
  VIL_ROLES.forEach(function(k){vScore+=POWER[k]*(cfg[k]||0);vCount+=(cfg[k]||0);});
  vScore+=(cfg.villager||0)*POWER.villager; vCount+=(cfg.villager||0);
  var wEff = wScore*1.5;
  return {wEff:wEff, vScore:vScore, diff:Math.abs(wEff-vScore), ratio:wCount/(wCount+vCount)};
}
